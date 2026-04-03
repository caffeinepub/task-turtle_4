import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import OutCall "http-outcalls/outcall";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Array "mo:core/Array";
import List "mo:core/List";
import Random "mo:core/Random";
import Option "mo:core/Option";
import Iter "mo:core/Iter";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

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

  public type UserProfileEntry = {
    principal : Text;
    profile : UserProfile;
  };

  type TaskStatus = {
    #open;
    #accepted;
    #completed;
  };

  // Task type unchanged for stable variable compatibility
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

  // Task stage tracking
  type TaskStage = {
    #posted;
    #accepted;
    #on_the_way;
    #arrived;
    #verified;
    #delivered;
  };

  type TaskStageRecord = {
    stage : TaskStage;
    timestamp : Int;
  };

  public type TaskStageResponse = {
    stage : Text;
    timestamp : Int;
  };

  public type TaskParticipantProfiles = {
    posterProfile : ?UserProfile;
    taskerProfile : ?UserProfile;
  };

  // Timestamps stored separately to avoid structural actor migration
  type TaskTimestamps = {
    acceptedAt : ?Int;
    completedAt : ?Int;
  };

  // Pricing breakdown stored separately
  type TaskPricing = {
    taskerFee : Nat;
    boost : Nat;
    productAmount : Nat;
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
    acceptedAt : ?Int;
    completedAt : ?Int;
    taskerFee : Nat;
    boost : Nat;
    productAmount : Nat;
  };

  // ========== PICKUP-DROP TASK MODULE ==========
  // Store task status as variant for stable variable compatibility
  type PickupDropTaskStatus = {
    #open;
    #accepted;
    #in_progress;
    #completed;
    #failed;
  };

  type PickupDropTask = {
    id : Text;
    pickupOwnerName : Text;
    pickupContact : Text;
    pickupLocation : Text;
    dropOwnerName : Text;
    dropContact : Text;
    dropLocation : Text;
    productWorth : Nat;
    taskerFee : Nat;
    boostFee : Nat;
    status : PickupDropTaskStatus;
    poster : Principal;
    acceptor : ?Principal;
    razorpayOrderId : Text;
    razorpayPaymentId : Text;
    createdAt : Int;
  };

  // Store active task status as variant for stable variable compatibility
  type PickupDropActiveTaskStatus = {
    #pending_pickup;
    #picked_up;
    #delivered;
    #failed;
  };

  type PickupDropActiveTask = {
    taskId : Text;
    taskerId : Principal;
    taskerPaymentDone : Bool;
    status : PickupDropActiveTaskStatus;
    otpPickup : Text;
    otpDelivery : Text;
    taskerOrderId : Text;
    taskerPaymentId : Text;
  };

  public type PublicPickupDropTask = {
    id : Text;
    pickupOwnerName : Text;
    pickupContact : Text;
    pickupLocation : Text;
    dropOwnerName : Text;
    dropContact : Text;
    dropLocation : Text;
    productWorth : Nat;
    taskerFee : Nat;
    boostFee : Nat;
    status : Text;
    poster : Principal;
    acceptor : ?Principal;
    razorpayOrderId : Text;
    razorpayPaymentId : Text;
    createdAt : Int;
  };

  // Authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let payments = Map.empty<Text, EscrowPayment>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let tasks = Map.empty<Text, Task>();
  // Separate map for task timestamps — avoids breaking stable Task type
  let taskTimestamps = Map.empty<Text, TaskTimestamps>();
  let taskStages = Map.empty<Text, TaskStageRecord>();
  let taskPricing = Map.empty<Text, TaskPricing>();

  // Pickup-Drop Task storage
  let pickupDropTasks = Map.empty<Text, PickupDropTask>();
  let pickupDropActiveTasks = Map.empty<Text, PickupDropActiveTask>();

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

  // Admin: get all user profiles
  public query ({ caller }) func getAllUserProfiles() : async [UserProfileEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all profiles");
    };
    userProfiles.entries().toArray().map(func((p, profile)) : UserProfileEntry {
      { principal = p.toText(); profile }
    });
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

  // Helper: convert Task to PublicTask, merging timestamps from separate map
  func toPublicTask(task : Task) : PublicTask {
    let ts = taskTimestamps.get(task.id);
    let acceptedAt : ?Int = switch (ts) { case (?t) { t.acceptedAt }; case (null) { null } };
    let completedAt : ?Int = switch (ts) { case (?t) { t.completedAt }; case (null) { null } };
    let pricing = taskPricing.get(task.id);
    let taskerFee : Nat = switch (pricing) { case (?p) { p.taskerFee }; case (null) { 0 } };
    let boost : Nat = switch (pricing) { case (?p) { p.boost }; case (null) { 0 } };
    let productAmount : Nat = switch (pricing) { case (?p) { p.productAmount }; case (null) { 0 } };
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
      acceptedAt;
      completedAt;
      taskerFee;
      boost;
      productAmount;
    };
  };

  // Task Management
  public shared ({ caller }) func createTask(title : Text, description : Text, category : Text, location : Text, amount : Nat, taskerFee : Nat, boost : Nat) : async ?Text {
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
    // Store pricing breakdown
    taskPricing.add(taskId, { taskerFee; boost; productAmount = amount });
    // Set initial stage
    taskStages.add(taskId, { stage = #posted; timestamp = Time.now() });
    ?taskId;
  };

  public shared ({ caller }) func acceptTask(taskId : Text) : async ?PublicTask {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept tasks");
    };
    switch (tasks.get(taskId)) {
      case (null) { null };
      case (?task) {
        if (task.poster == caller) {
          Runtime.trap("Unauthorized: Cannot accept your own task");
        };
        switch (task.status, task.acceptor) {
          case (#open, _) {
            let updatedTask = { task with acceptor = ?caller; status = #accepted };
            tasks.add(taskId, updatedTask);
            // Record accepted timestamp
            let prevTs = taskTimestamps.get(taskId);
            let prevCompleted : ?Int = switch (prevTs) { case (?t) { t.completedAt }; case (null) { null } };
            taskTimestamps.add(taskId, { acceptedAt = ?Time.now(); completedAt = prevCompleted });
            // Set stage to accepted
            taskStages.add(taskId, { stage = #accepted; timestamp = Time.now() });
            ?toPublicTask(updatedTask);
          };
          case (#accepted, _) { Runtime.trap("Task is not open") };
          case (#completed, _) { Runtime.trap("Task is already completed") };
        };
      };
    };
  };

  // Helper function to get stage order for validation
  func getStageOrder(stage : TaskStage) : Nat {
    switch (stage) {
      case (#posted) { 0 };
      case (#accepted) { 1 };
      case (#on_the_way) { 2 };
      case (#arrived) { 3 };
      case (#verified) { 4 };
      case (#delivered) { 5 };
    };
  };

  // Move through stages: tasker can go to on_the_way, arrived, and verified
  public shared ({ caller }) func advanceTaskStage(taskId : Text, newStage : Text) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can advance task stage");
    };
    let task = switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) { task };
    };
    // Only tasker (acceptor) can call this
    if (task.acceptor != ?caller) {
      Runtime.trap("Unauthorized: Only the tasker can advance the stage");
    };

    // Get current stage
    let currentStageRecord = switch (taskStages.get(taskId)) {
      case (null) { Runtime.trap("Task stage not found") };
      case (?record) { record };
    };

    // Parse and validate new stage
    let newStageVariant = switch (newStage) {
      case ("on_the_way") { #on_the_way };
      case ("arrived") { #arrived };
      case ("verified") { #verified };
      case (_) { Runtime.trap("Invalid stage: only on_the_way, arrived, and verified are allowed") };
    };

    // Validate stage progression (must advance forward only)
    let currentOrder = getStageOrder(currentStageRecord.stage);
    let newOrder = getStageOrder(newStageVariant);

    if (newOrder <= currentOrder) {
      return #err("Stage must advance forward only");
    };

    // Update stage
    taskStages.add(taskId, {
      stage = newStageVariant;
      timestamp = Time.now();
    });
    #ok;
  };

  public shared ({ caller }) func completeTask(taskId : Text, submittedOtp : Text) : async ?PublicTask {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete tasks");
    };
    let task = switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
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
    // Record completed timestamp
    let prevTs = taskTimestamps.get(taskId);
    let prevAccepted : ?Int = switch (prevTs) { case (?t) { t.acceptedAt }; case (null) { null } };
    taskTimestamps.add(taskId, { acceptedAt = prevAccepted; completedAt = ?Time.now() });
    // Set stage to delivered
    taskStages.add(taskId, { stage = #delivered; timestamp = Time.now() });
    ?toPublicTask(updatedTask);
  };

  // Cancel task - only poster, only when open
  public shared ({ caller }) func cancelTask(taskId : Text) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (tasks.get(taskId)) {
      case (null) { #err("Task not found") };
      case (?task) {
        if (task.poster != caller) {
          Runtime.trap("Unauthorized: Only task poster can cancel");
        };
        switch (task.status) {
          case (#open) {
            tasks.remove(taskId);
            taskTimestamps.remove(taskId);
            taskStages.remove(taskId);
            #ok;
          };
          case (_) { #err("Task cannot be cancelled after being accepted") };
        };
      };
    };
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

  // Task stage tracking - public query, anyone can view
  public query ({ caller }) func getTaskStage(taskId : Text) : async ?TaskStageResponse {
    switch (taskStages.get(taskId)) {
      case (null) { null };
      case (?record) {
        ?{
          stage = switch (record.stage) {
            case (#posted) { "posted" };
            case (#accepted) { "accepted" };
            case (#on_the_way) { "on_the_way" };
            case (#arrived) { "arrived" };
            case (#verified) { "verified" };
            case (#delivered) { "delivered" };
          };
          timestamp = record.timestamp;
        };
      };
    };
  };

  // Get both poster and tasker profiles for a task - only accessible to participants
  public query ({ caller }) func getTaskParticipantProfiles(taskId : Text) : async ?TaskParticipantProfiles {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view task participant profiles");
    };
    switch (tasks.get(taskId)) {
      case (null) { null };
      case (?task) {
        // Only allow access if caller is poster or tasker
        let isPoster = task.poster == caller;
        let isTasker = switch (task.acceptor) {
          case (?acceptor) { acceptor == caller };
          case (null) { false };
        };
        if (isPoster or isTasker) {
          ?{
            posterProfile = userProfiles.get(task.poster);
            taskerProfile = switch (task.acceptor) {
              case (?acceptor) { userProfiles.get(acceptor) };
              case (null) { null };
            };
          };
        } else {
          Runtime.trap("Unauthorized: Only participants can view task profiles");
        };
      };
    };
  };

  // ========== PICKUP-DROP TASK FUNCTIONS ==========

  // Helper: convert PickupDropTask to PublicPickupDropTask
  func toPublicPickupDropTask(task : PickupDropTask) : PublicPickupDropTask {
    {
      id = task.id;
      pickupOwnerName = task.pickupOwnerName;
      pickupContact = task.pickupContact;
      pickupLocation = task.pickupLocation;
      dropOwnerName = task.dropOwnerName;
      dropContact = task.dropContact;
      dropLocation = task.dropLocation;
      productWorth = task.productWorth;
      taskerFee = task.taskerFee;
      boostFee = task.boostFee;
      status = switch (task.status) {
        case (#open) { "open" };
        case (#accepted) { "accepted" };
        case (#in_progress) { "in_progress" };
        case (#completed) { "completed" };
        case (#failed) { "failed" };
      };
      poster = task.poster;
      acceptor = task.acceptor;
      razorpayOrderId = task.razorpayOrderId;
      razorpayPaymentId = task.razorpayPaymentId;
      createdAt = task.createdAt;
    };
  };

  // Create pickup-drop task - requires user permission
  public shared ({ caller }) func createPickupDropTask(
    pickupOwnerName : Text,
    pickupContact : Text,
    pickupLocation : Text,
    dropOwnerName : Text,
    dropContact : Text,
    dropLocation : Text,
    productWorth : Nat,
    taskerFee : Nat,
    boostFee : Nat,
    razorpayOrderId : Text,
    razorpayPaymentId : Text
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create pickup-drop tasks");
    };

    let taskId = generateUniqueId();
    let newTask : PickupDropTask = {
      id = taskId;
      pickupOwnerName;
      pickupContact;
      pickupLocation;
      dropOwnerName;
      dropContact;
      dropLocation;
      productWorth;
      taskerFee;
      boostFee;
      status = #open;
      poster = caller;
      acceptor = null;
      razorpayOrderId;
      razorpayPaymentId;
      createdAt = Time.now();
    };

    pickupDropTasks.add(taskId, newTask);
    taskId;
  };

  // Get all open pickup-drop tasks - public query
  public query ({ caller }) func getPickupDropTasks() : async [PublicPickupDropTask] {
    pickupDropTasks.values()
      .toArray()
      .filter(func(task) { 
        switch (task.status) {
          case (#open) { true };
          case (_) { false };
        };
      })
      .map(toPublicPickupDropTask);
  };

  // Get my posted pickup-drop tasks - requires user permission
  public query ({ caller }) func getMyPickupDropPostedTasks() : async [PublicPickupDropTask] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their posted tasks");
    };

    pickupDropTasks.filter(func(_id, task) { task.poster == caller })
      .values()
      .toArray()
      .map(toPublicPickupDropTask);
  };

  // Get my accepted pickup-drop tasks - requires user permission
  public query ({ caller }) func getMyPickupDropAcceptedTasks() : async [PublicPickupDropTask] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their accepted tasks");
    };

    pickupDropTasks.values()
      .toArray()
      .filter(func(task) {
        switch (task.acceptor) {
          case (?acceptor) { acceptor == caller };
          case (null) { false };
        };
      })
      .map(toPublicPickupDropTask);
  };

  // Accept pickup-drop task - requires user permission
  public shared ({ caller }) func acceptPickupDropTask(
    taskId : Text,
    taskerOrderId : Text,
    taskerPaymentId : Text
  ) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept pickup-drop tasks");
    };

    let task = switch (pickupDropTasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) { task };
    };

    if (task.poster == caller) {
      Runtime.trap("Unauthorized: Cannot accept your own task");
    };

    switch (task.status) {
      case (#open) {
        // Generate OTPs
        let otpPickup = await generateOtp();
        let otpDelivery = await generateOtp();

        // Update task
        let updatedTask = {
          task with
          status = #accepted;
          acceptor = ?caller;
        };
        pickupDropTasks.add(taskId, updatedTask);

        // Create active task record
        let activeTask : PickupDropActiveTask = {
          taskId;
          taskerId = caller;
          taskerPaymentDone = true;
          status = #pending_pickup;
          otpPickup;
          otpDelivery;
          taskerOrderId;
          taskerPaymentId;
        };
        pickupDropActiveTasks.add(taskId, activeTask);

        #ok;
      };
      case (_) { #err("Task is not open") };
    };
  };

  // Complete pickup - requires user permission
  public shared ({ caller }) func completePickupDropPickup(taskId : Text, otp : Text) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete pickup");
    };

    let activeTask = switch (pickupDropActiveTasks.get(taskId)) {
      case (null) { Runtime.trap("Active task not found") };
      case (?task) { task };
    };

    if (activeTask.taskerId != caller) {
      Runtime.trap("Unauthorized: Only the tasker can complete pickup");
    };

    if (activeTask.otpPickup != otp) {
      Runtime.trap("Incorrect pickup OTP");
    };

    switch (activeTask.status) {
      case (#pending_pickup) {
        // Update active task status
        let updatedActiveTask = { activeTask with status = #picked_up };
        pickupDropActiveTasks.add(taskId, updatedActiveTask);

        // Update main task status
        let task = switch (pickupDropTasks.get(taskId)) {
          case (null) { Runtime.trap("Task not found") };
          case (?task) { task };
        };
        let updatedTask = { task with status = #in_progress };
        pickupDropTasks.add(taskId, updatedTask);

        #ok;
      };
      case (_) { #err("Task is not in pending_pickup state") };
    };
  };

  // Complete delivery - requires user permission
  public shared ({ caller }) func completePickupDropDelivery(taskId : Text, otp : Text) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete delivery");
    };

    let activeTask = switch (pickupDropActiveTasks.get(taskId)) {
      case (null) { Runtime.trap("Active task not found") };
      case (?task) { task };
    };

    if (activeTask.taskerId != caller) {
      Runtime.trap("Unauthorized: Only the tasker can complete delivery");
    };

    if (activeTask.otpDelivery != otp) {
      Runtime.trap("Incorrect delivery OTP");
    };

    switch (activeTask.status) {
      case (#picked_up) {
        // Update active task status
        let updatedActiveTask = { activeTask with status = #delivered };
        pickupDropActiveTasks.add(taskId, updatedActiveTask);

        // Update main task status
        let task = switch (pickupDropTasks.get(taskId)) {
          case (null) { Runtime.trap("Task not found") };
          case (?task) { task };
        };
        let updatedTask = { task with status = #completed };
        pickupDropTasks.add(taskId, updatedTask);

        #ok;
      };
      case (_) { #err("Task is not in picked_up state") };
    };
  };

  // Get single pickup-drop task - public query
  public query ({ caller }) func getPickupDropTask(taskId : Text) : async ?PublicPickupDropTask {
    switch (pickupDropTasks.get(taskId)) {
      case (null) { null };
      case (?task) { ?toPublicPickupDropTask(task) };
    };
  };

  // Get all pickup-drop tasks - admin only
  public query ({ caller }) func getAllPickupDropTasksAdmin() : async [PublicPickupDropTask] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all pickup-drop tasks");
    };
    pickupDropTasks.values().toArray().map(toPublicPickupDropTask);
  };

  // Fail pickup-drop task - admin only
  public shared ({ caller }) func failPickupDropTask(taskId : Text) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can fail tasks");
    };

    let task = switch (pickupDropTasks.get(taskId)) {
      case (null) { return #err("Task not found") };
      case (?task) { task };
    };

    let updatedTask = { task with status = #failed };
    pickupDropTasks.add(taskId, updatedTask);

    // Update active task if exists
    switch (pickupDropActiveTasks.get(taskId)) {
      case (?activeTask) {
        let updatedActiveTask = { activeTask with status = #failed };
        pickupDropActiveTasks.add(taskId, updatedActiveTask);
      };
      case (null) { };
    };

    #ok;
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
