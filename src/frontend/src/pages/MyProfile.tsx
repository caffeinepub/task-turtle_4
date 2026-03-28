import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  IdCard,
  Loader2,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppNavbar } from "../components/AppNavbar";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const GREEN = "#00E676";

interface FormState {
  name: string;
  phone: string;
  location: string;
  upiId: string;
  aadharNumber: string;
  studentId: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  location?: string;
  upiId?: string;
  aadharOrStudent?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Full name is required";
  if (!form.phone.trim()) errors.phone = "Phone number is required";
  else if (!/^\d{10}$/.test(form.phone.trim()))
    errors.phone = "Phone must be exactly 10 digits";
  if (!form.location.trim()) errors.location = "Location is required";
  if (!form.upiId.trim()) errors.upiId = "UPI ID is required";
  else if (!form.upiId.includes("@"))
    errors.upiId = 'UPI ID must contain "@" (e.g., name@upi)';
  if (!form.aadharNumber.trim() && !form.studentId.trim()) {
    errors.aadharOrStudent = "Please fill either Aadhar Number or Student ID";
  } else if (
    form.aadharNumber.trim() &&
    !/^\d{12}$/.test(form.aadharNumber.trim())
  ) {
    errors.aadharOrStudent = "Aadhar Number must be exactly 12 digits";
  }
  return errors;
}

const inputBase: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  color: "white",
  padding: "12px 16px",
  width: "100%",
  fontSize: "14px",
  outline: "none",
};

const inputError: React.CSSProperties = {
  ...inputBase,
  border: "1px solid #f87171",
};

function FormField({
  id,
  label,
  icon,
  required,
  children,
  error,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center gap-2 mb-2 text-sm font-medium"
        style={{ color: "rgba(255,255,255,0.7)" }}
      >
        {icon} {label}
        {required && <span style={{ color: "#f87171" }}>*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function MyProfile() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    location: "",
    upiId: "",
    aadharNumber: "",
    studentId: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!actor || isFetching) return;
    setLoading(true);
    actor
      .getCallerUserProfile()
      .then((profile) => {
        if (profile) {
          setForm({
            name: profile.name ?? "",
            phone: profile.phone ?? "",
            location: profile.location ?? "",
            upiId: profile.upiId ?? "",
            aadharNumber: profile.aadharNumber ?? "",
            studentId: profile.studentId ?? "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [actor, isFetching]);

  const handleChange = (field: keyof FormState, value: string) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (touched) {
      const errs = validate(updated);
      setErrors(errs);
      if (Object.keys(errs).length === 0) setGlobalError("");
    }
    setSuccessMsg("");
  };

  const handleSave = async () => {
    setTouched(true);
    const errs = validate(form);
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      setGlobalError("Please fill all details");
      return;
    }

    if (!actor) {
      setGlobalError("Not connected. Please refresh.");
      return;
    }

    setSaving(true);
    setGlobalError("");
    try {
      const profile: {
        name: string;
        phone: string;
        location: string;
        upiId: string;
        aadharNumber?: string;
        studentId?: string;
      } = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
        upiId: form.upiId.trim(),
      };
      if (form.aadharNumber.trim())
        profile.aadharNumber = form.aadharNumber.trim();
      if (form.studentId.trim()) profile.studentId = form.studentId.trim();

      await actor.saveCallerUserProfile(profile);
      setSuccessMsg("Profile Saved Successfully");
    } catch {
      setGlobalError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = Object.keys(validate(form)).length === 0;
  const saveDisabled = saving || (touched && !isFormValid);

  if (!identity) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#050505" }}
      >
        <p style={{ color: "rgba(255,255,255,0.5)" }}>
          Please log in to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#050505" }}>
      <AppNavbar currentPage="profile" />

      <main className="max-w-xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            My <span style={{ color: GREEN }}>Profile</span>
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Manage your personal details
          </p>
        </div>
        {loading ? (
          <div
            className="flex items-center justify-center py-20"
            data-ocid="profile.loading_state"
          >
            <Loader2
              className="animate-spin"
              size={32}
              style={{ color: GREEN }}
            />
          </div>
        ) : (
          <div
            className="rounded-2xl p-6 md:p-8"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {globalError && (
              <div
                data-ocid="profile.error_state"
                className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl"
                style={{
                  background: "rgba(248,113,113,0.12)",
                  border: "1px solid rgba(248,113,113,0.3)",
                }}
              >
                <AlertCircle
                  size={16}
                  style={{ color: "#f87171", flexShrink: 0 }}
                />
                <span style={{ color: "#f87171", fontSize: "14px" }}>
                  {globalError}
                </span>
              </div>
            )}

            {successMsg && (
              <div
                data-ocid="profile.success_state"
                className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl"
                style={{
                  background: "rgba(0,230,118,0.12)",
                  border: "1px solid rgba(0,230,118,0.3)",
                }}
              >
                <CheckCircle2
                  size={16}
                  style={{ color: GREEN, flexShrink: 0 }}
                />
                <span
                  style={{ color: GREEN, fontSize: "14px", fontWeight: 600 }}
                >
                  {successMsg}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-5">
              <FormField
                id="profile_name"
                label="Full Name"
                icon={<User size={14} />}
                required
                error={touched ? errors.name : undefined}
              >
                <input
                  id="profile_name"
                  data-ocid="profile.name.input"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  style={touched && errors.name ? inputError : inputBase}
                />
              </FormField>

              <FormField
                id="profile_phone"
                label="Phone Number"
                icon={<Phone size={14} />}
                required
                error={touched ? errors.phone : undefined}
              >
                <input
                  id="profile_phone"
                  data-ocid="profile.phone.input"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={(e) =>
                    handleChange(
                      "phone",
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  style={touched && errors.phone ? inputError : inputBase}
                />
              </FormField>

              <FormField
                id="profile_location"
                label="Location"
                icon={<MapPin size={14} />}
                required
                error={touched ? errors.location : undefined}
              >
                <input
                  id="profile_location"
                  data-ocid="profile.location.input"
                  type="text"
                  placeholder="City, Address"
                  value={form.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  style={touched && errors.location ? inputError : inputBase}
                />
              </FormField>

              <FormField
                id="profile_upi"
                label="UPI ID"
                icon={<CreditCard size={14} />}
                required
                error={touched ? errors.upiId : undefined}
              >
                <input
                  id="profile_upi"
                  data-ocid="profile.upi.input"
                  type="text"
                  placeholder="yourname@upi"
                  value={form.upiId}
                  onChange={(e) => handleChange("upiId", e.target.value)}
                  style={touched && errors.upiId ? inputError : inputBase}
                />
              </FormField>

              {/* Identity Section */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p
                  className="text-xs font-semibold mb-4 flex items-center gap-1.5"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <IdCard size={13} />
                  IDENTITY VERIFICATION — Fill at least one
                  <span style={{ color: "#f87171" }}>*</span>
                </p>

                <div className="mb-4">
                  <label
                    htmlFor="profile_aadhar"
                    className="block mb-2 text-sm font-medium"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    Aadhar Card Number
                  </label>
                  <input
                    id="profile_aadhar"
                    data-ocid="profile.aadhar.input"
                    type="text"
                    placeholder="12-digit Aadhar number"
                    value={form.aadharNumber}
                    onChange={(e) =>
                      handleChange(
                        "aadharNumber",
                        e.target.value.replace(/\D/g, "").slice(0, 12),
                      )
                    }
                    style={
                      touched &&
                      errors.aadharOrStudent &&
                      !form.studentId.trim()
                        ? inputError
                        : inputBase
                    }
                  />
                </div>

                <div className="flex items-center gap-3 my-3">
                  <div
                    className="flex-1 h-px"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    OR
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile_student"
                    className="block mb-2 text-sm font-medium"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    Student ID
                  </label>
                  <input
                    id="profile_student"
                    data-ocid="profile.student_id.input"
                    type="text"
                    placeholder="Your student/college ID"
                    value={form.studentId}
                    onChange={(e) => handleChange("studentId", e.target.value)}
                    style={
                      touched &&
                      errors.aadharOrStudent &&
                      !form.aadharNumber.trim()
                        ? inputError
                        : inputBase
                    }
                  />
                </div>

                {touched && errors.aadharOrStudent && (
                  <p className="mt-2 text-xs" style={{ color: "#f87171" }}>
                    {errors.aadharOrStudent}
                  </p>
                )}
              </div>

              <button
                type="button"
                data-ocid="profile.save_button"
                onClick={handleSave}
                disabled={saveDisabled}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                style={{
                  background: saveDisabled ? "rgba(0,230,118,0.3)" : GREEN,
                  color: saveDisabled ? "rgba(0,0,0,0.4)" : "#050505",
                  cursor: saveDisabled ? "not-allowed" : "pointer",
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Profile"
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
