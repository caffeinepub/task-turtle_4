import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type OldUserProfile = {
    name : Text;
  };

  // Original actor type
  type OldActor = {
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  // Extended user profile type.
  type NewUserProfile = {
    name : Text;
    phone : Text;
    location : Text;
    upiId : Text;
    aadharNumber : ?Text;
    studentId : ?Text;
  };

  // New actor type
  type NewActor = {
    userProfiles : Map.Map<Principal, NewUserProfile>;
  };

  // Migration function called by the main actor via the with-clause
  public func run(old : OldActor) : NewActor {
    let newUserProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(_principal, oldUserProfile) {
        {
          oldUserProfile with
          phone = "";
          location = "";
          upiId = "";
          aadharNumber = null;
          studentId = null;
        };
      }
    );
    { userProfiles = newUserProfiles };
  };
};
