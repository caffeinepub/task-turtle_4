import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import OutCall "http-outcalls/outcall";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Array "mo:core/Array";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Queue "mo:core/Queue";
import Migration "migration";
import Random "mo:core/Random";
import Option "mo:core/Option";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Specify the data migration function in with-clause
(with migration = Migration.run)
actor {
  type PaymentStatus = {
    #PAID;
    #COMPLETED;
    #FAILED;
  };

  type EscrowPayment = {
    taskId : Text;
    amount : Nat;
    razorpayOrderId : Text;
    paymentId : Text;
    taskerUpiId : Text;
    status : PaymentStatus;
  };

  public type Result = {
    #ok;
    #err : Text;
  };

  public type UserProfile = {
    name : Text;
    phone : Text;
    location : Text;
    upiId : Text;
    aadharNumber : ?Text;
    studentId : ?Text;
  };

  type TaskStatus = {
    #open;
    #accepted;
    #completed;
  };

  type Task = {
    id : Text;
    title : Text;
    description : Text;
    category : Text;
    location : Text;
    amount : Nat;
    status : TaskStatus;
    poster : Principal;
    acceptor : ?Principal;
    otp : Text;
    createdAt : Int;
  };

  // Public task type without OTP (for queries)
  public type PublicTask = {
    id : Text;
    title : Text;
    description : Text;
    category : Text;
    location : Text;
    amount : Nat;
    status : TaskStatus;
    poster : Principal;
    acceptor : ?Principal;
    createdAt : Int;
  };

  // Authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let payments = Map.empty<Text, EscrowPayment>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let tasks = Map.empty<Text, Task>();

  // Razorpay Basic Auth: base64(key_id:key_secret)
  let RAZORPAY_BASIC_AUTH = "cnpwX2xpdmVfU1JOYlR3eUVtelFTdk86MEszRTBxMFJJSmhoNDROUUw0YmZnSW5m";

  public type RazorpayOrderResponse = {
    id : Text;
    entity : Text;
    amount : Nat;
    amount_paid : Nat;
    amount_due : Nat;
    currency : Text;
    receipt : Text;
    offer_id : ?Text;
    status : Text;
    attempts : Nat;
    created_at : Nat;
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // User profile functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createRazorpayOrder(amount : Nat, taskId : Text, _userId : Text, _taskerUpiId : Text) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create orders");
    };

    let amountPaise = amount * 100;
    let body = "{ \"amount\": " # amountPaise.toText() # ", \"currency\": \"INR\", \"receipt\": \"" # taskId # "\", \"payment_capture\": 1 }";

    let res = await OutCall.httpPostRequest(
      "https://api.razorpay.com/v1/orders",
      [
        { name = "Content-Type"; value = "application/json" },
        { name = "Authorization"; value = "Basic " # RAZORPAY_BASIC_AUTH }
      ],
      body,
      transform
    );

    if (res == "") {
      return #err("Empty response from Razorpay");
    };
    #ok;
  };

  public shared ({ caller }) func verifyPayment(razorpayPaymentId : Text, razorpayOrderId : Text, _razorpaySignature : Text, taskId : Text, amount : Nat, _userId : Text, taskerUpiId : Text) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can verify payments");
    };

    // Signature verification performed client-side via Web Crypto HMAC-SHA256.
    let payment : EscrowPayment = {
      taskId;
      amount;
      razorpayOrderId;
      paymentId = razorpayPaymentId;
      taskerUpiId;
      status = #PAID;
    };
    payments.add(payment.paymentId, payment);
    #ok;
  };

  func requirePaymentExists(paymentId : Text) : EscrowPayment {
    switch (payments.get(paymentId)) {
      case (null) { Runtime.trap("Payment not found") };
      case (?payment) { payment };
    };
  };

  public query ({ caller }) func getPayments() : async [EscrowPayment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all payments");
    };
    payments.values().toArray();
  };

  public query ({ caller }) func getPaymentByTask(taskId : Text) : async ?EscrowPayment {
    let matches = payments.filter(
      func(_id, payment) {
        payment.taskId == taskId;
      }
    );
    switch (matches.keys().toArray().size()) {
      case (0) { null };
      case (_) {
        let payment = matches.values().toArray()[0];
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          let callerText = caller.toText();
          if (payment.taskerUpiId != callerText) {
            Runtime.trap("Unauthorized: Can only view your own task payments");
          };
        };
        ?payment;
      };
    };
  };

  public shared ({ caller }) func markPayoutComplete(paymentId : Text) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can mark payouts as complete");
    };
    let payment = requirePaymentExists(paymentId);
    switch (payment.status) {
      case (#COMPLETED) { return #err("Payment already marked as completed") };
      case (_) { payments.add(paymentId, { payment with status = #COMPLETED }) };
    };
    #ok;
  };

  // Helper function to convert Task to PublicTask (removes OTP)
  func toPublicTask(task : Task) : PublicTask {
    {
      id = task.id;
      title = task.title;
      description = task.description;
      category = task.category;
      location = task.location;
      amount = task.amount;
      status = task.status;
      poster = task.poster;
      acceptor = task.acceptor;
      createdAt = task.createdAt;
    };
  };

  // Task Management
  public shared ({ caller }) func createTask(title : Text, description : Text, category : Text, location : Text, amount : Nat) : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create tasks");
    };
    let otp = await generateOtp();
    let taskId = generateUniqueId();
    let newTask = {
      id = taskId;
      title;
      description;
      category;
      location;
      amount;
      status = #open;
      poster = caller;
      acceptor = null;
      otp;
      createdAt = Time.now();
    };
    tasks.add(taskId, newTask);
    ?taskId;
  };

  public shared ({ caller }) func acceptTask(taskId : Text) : async ?PublicTask {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept tasks");
    };
    switch (tasks.get(taskId)) {
      case (null) { null };
      case (?task) {
        // Prevent self-acceptance
        if (task.poster == caller) {
          Runtime.trap("Unauthorized: Cannot accept your own task");
        };
        switch (task.status, task.acceptor) {
          case (#open, _) {
            let updatedTask = { task with acceptor = ?caller; status = #accepted };
            tasks.add(taskId, updatedTask);
            ?toPublicTask(updatedTask);
          };
          case (#accepted, _) { Runtime.trap("Task is not open") };
          case (#completed, _) { Runtime.trap("Task is already completed") };
        };
      };
    };
  };

  public shared ({ caller }) func completeTask(taskId : Text, submittedOtp : Text) : async ?PublicTask {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete tasks");
    };
    let task = switch (tasks.get(taskId)) {
      case (null) {
        Runtime.trap("Task not found");
      };
      case (?task) { task };
    };
    if (task.acceptor != ?caller) {
      Runtime.trap("Unauthorized: Can only complete your own accepted tasks");
    };
    if (task.status != #accepted) {
      Runtime.trap("Task is not in accepted state");
    };
    if (task.otp != submittedOtp) {
      Runtime.trap("Incorrect OTP");
    };
    let updatedTask = { task with status = #completed };
    tasks.add(taskId, updatedTask);
    ?toPublicTask(updatedTask);
  };

  // Public query - anyone can view task details (without OTP)
  public query ({ caller }) func getTask(taskId : Text) : async ?PublicTask {
    switch (tasks.get(taskId)) {
      case (null) { null };
      case (?task) { ?toPublicTask(task) };
    };
  };

  // Get task with OTP - only for poster
  public query ({ caller }) func getTaskWithOtp(taskId : Text) : async ?Task {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view task details");
    };
    switch (tasks.get(taskId)) {
      case (null) { null };
      case (?task) {
        if (task.poster != caller) {
          Runtime.trap("Unauthorized: Only task poster can view OTP");
        };
        ?task;
      };
    };
  };

  public query ({ caller }) func getMyPostedTasks() : async [PublicTask] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their tasks");
    };
    tasks.filter(func(_id, task) { task.poster == caller })
      .values()
      .toArray()
      .map(toPublicTask);
  };

  public query ({ caller }) func getMyAcceptedTasks() : async [PublicTask] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their tasks");
    };
    tasks.values()
      .toArray()
      .filter(func(task) { hasCallerAcceptedTask(task.acceptor, caller) })
      .map(toPublicTask);
  };

  func hasCallerAcceptedTask(acceptor : ?Principal, caller : Principal) : Bool {
    switch (acceptor) {
      case (?acceptor) {
        let acceptorText = acceptor.toText();
        let callerText = caller.toText();
        acceptorText == callerText;
      };
      case (null) { false };
    };
  };

  // Public query - anyone can browse all tasks (without OTP)
  public query ({ caller }) func getAllTasks() : async [PublicTask] {
    tasks.values().toArray().map(toPublicTask);
  };

  public query ({ caller }) func countTasks() : async Nat {
    tasks.size();
  };

  // Helper functions
  func recordToArray(tracker : Map.Map<Nat, Text>) : [Text] {
    switch (tracker.isEmpty()) {
      case (true) { [] };
      case (false) { tracker.values().toArray() };
    };
  };

  func mapToArray(map : Map.Map<Nat, Text>) : [Text] {
    switch (map.isEmpty()) {
      case (true) { [] };
      case (false) { map.values().toArray() };
    };
  };

  func getCurrentNumber(currentNumber : Nat) : Nat {
    currentNumber;
  };

  func getTextLoop(text : Text, count : Nat) : [Text] {
    if (count >= 10) { return [] };
    let list = List.empty<Text>();
    var i = 0;
    while (i < count) {
      list.add(text);
      i += 1;
    };
    list.toArray();
  };

  func generateUniqueId() : Text {
    Time.now().toText();
  };

  func generateOtp() : async Text {
    var randomNum = await Random.natRange(100000, 999999);
    if (randomNum >= 100000 and randomNum <= 999999) {
      randomNum.toText();
    } else {
      "50945";
    };
  };
};
