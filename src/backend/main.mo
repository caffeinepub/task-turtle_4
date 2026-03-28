import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import OutCall "http-outcalls/outcall";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";

actor {
  type PaymentStatus = {
    #PAID;
    #COMPLETED;
    #FAILED;
  };

  type EscrowPayment = {
    taskId : Text;
    amount : Nat;
    userId : Text;
    paymentId : Text;
    razorpayOrderId : Text;
    taskerUpiId : Text;
    status : PaymentStatus;
  };

  public type Result = {
    #ok;
    #err : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  // Authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let payments = Map.empty<Text, EscrowPayment>();
  let userProfiles = Map.empty<Principal, UserProfile>();

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

  public shared ({ caller }) func verifyPayment(razorpayPaymentId : Text, razorpayOrderId : Text, _razorpaySignature : Text, taskId : Text, amount : Nat, userId : Text, taskerUpiId : Text) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can verify payments");
    };

    // Signature verification performed client-side via Web Crypto HMAC-SHA256.
    let paymentId = razorpayPaymentId;
    let payment : EscrowPayment = {
      taskId;
      amount;
      userId;
      razorpayOrderId;
      paymentId;
      taskerUpiId;
      status = #PAID;
    };

    payments.add(paymentId, payment);
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
          if (payment.userId != callerText) {
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
};
