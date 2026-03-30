import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import OutCall "http-outcalls/outcall";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Array "mo:core/Array";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Queue "mo:core/Queue";

import Random "mo:core/Random";
import Option "mo:core/Option";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

module {
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

  type UserProfile = {
    name : Text;
    phone : Text;
    location : Text;
    upiId : Text;
    aadharNumber : ?Text;
    studentId : ?Text;
  };

  type UserProfileEntry = {
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

  // Timestamps stored separately to avoid stable variable migration
  type TaskTimestamps = {
    acceptedAt : ?Int;
    completedAt : ?Int;
  };

  // Public task type without OTP (for queries)
  type PublicTask = {
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

  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    payments : Map.Map<Text, EscrowPayment>;
    userProfiles : Map.Map<Principal, UserProfile>;
    tasks : Map.Map<Text, Task>;
    taskTimestamps : Map.Map<Text, TaskTimestamps>;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    payments : Map.Map<Text, EscrowPayment>;
    userProfiles : Map.Map<Principal, UserProfile>;
    tasks : Map.Map<Text, Task>;
    taskTimestamps : Map.Map<Text, TaskTimestamps>;
    taskStages : Map.Map<Text, TaskStageRecord>;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      taskStages = Map.empty<Text, TaskStageRecord>();
    };
  };
};
