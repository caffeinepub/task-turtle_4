import {
  AlertCircle,
  CheckCircle2,
  ClipboardCopy,
  CreditCard,
  Fingerprint,
  IdCard,
  Loader2,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { motion } from "motion/react";
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
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  color: "white",
  padding: "12px 16px",
  width: "100%",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.15s",
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
        className="flex items-center gap-2 mb-2 text-sm font-semibold"
        style={{ color: "rgba(255,255,255,0.65)" }}
      >
        {icon} {label}
        {required && <span style={{ color: "#f87171" }}>*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function PrincipalCopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{
        background: copied ? `${GREEN}22` : "rgba(255,255,255,0.08)",
        color: copied ? GREEN : "rgba(255,255,255,0.65)",
        border: `1px solid ${copied ? `${GREEN}40` : "rgba(255,255,255,0.12)"}`,
      }}
      title="Copy principal ID"
      data-ocid="profile.copy_id.button"
    >
      {copied ? (
        <>
          <CheckCircle2 size={12} /> Copied!
        </>
      ) : (
        <>
          <ClipboardCopy size={12} /> Copy
        </>
      )}
    </button>
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

  const principalText = identity?.getPrincipal().toText() ?? "";

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
      setGlobalError("Please fill all required details correctly");
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
        style={{ backgroundColor: "#000000" }}
      >
        <p style={{ color: "rgba(255,255,255,0.5)" }}>
          Please log in to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#000000" }}>
      <AppNavbar currentPage="profile" />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            My <span style={{ color: GREEN }}>Profile</span>
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Manage your identity and personal details
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
          <div className="flex flex-col gap-6">
            {/* Principal ID Hero Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-2xl p-6"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${GREEN}30`,
                backdropFilter: "blur(16px)",
                boxShadow: `0 0 32px ${GREEN}0d`,
              }}
              data-ocid="profile.id.card"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${GREEN}18`,
                    border: `1px solid ${GREEN}35`,
                  }}
                >
                  <Fingerprint size={18} style={{ color: GREEN }} />
                </div>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    Your Unique ID
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    Blockchain identity — used by admin to track your data
                  </p>
                </div>
              </div>

              <div
                className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3"
                style={{
                  background: `${GREEN}08`,
                  border: `1px solid ${GREEN}25`,
                }}
              >
                <span
                  className="font-mono text-sm flex-1 break-all"
                  style={{ color: GREEN, letterSpacing: "0.04em" }}
                  data-ocid="profile.principal_id.input"
                >
                  {principalText || "—"}
                </span>
                <PrincipalCopyBtn text={principalText} />
              </div>

              <p
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                🔒 This ID is read-only and linked to your Internet Identity
                wallet
              </p>
            </motion.div>

            {/* Profile Form Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 }}
              className="rounded-2xl p-6"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(0,230,118,0.12)",
                backdropFilter: "blur(16px)",
              }}
              data-ocid="profile.form.card"
            >
              {/* Section label */}
              <div className="flex items-center gap-2 mb-6">
                <User size={15} style={{ color: GREEN }} />
                <h2
                  className="text-sm font-bold tracking-wider"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  PERSONAL DETAILS
                </h2>
              </div>

              {/* Global error */}
              {globalError && (
                <div
                  data-ocid="profile.error_state"
                  className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl"
                  style={{
                    background: "rgba(248,113,113,0.1)",
                    border: "1px solid rgba(248,113,113,0.3)",
                  }}
                >
                  <AlertCircle
                    size={15}
                    style={{ color: "#f87171", flexShrink: 0 }}
                  />
                  <span style={{ color: "#f87171", fontSize: "13px" }}>
                    {globalError}
                  </span>
                </div>
              )}

              {/* Success banner */}
              {successMsg && (
                <div
                  data-ocid="profile.success_state"
                  className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl"
                  style={{
                    background: "rgba(0,230,118,0.1)",
                    border: "1px solid rgba(0,230,118,0.3)",
                  }}
                >
                  <CheckCircle2
                    size={15}
                    style={{ color: GREEN, flexShrink: 0 }}
                  />
                  <span
                    style={{ color: GREEN, fontSize: "13px", fontWeight: 600 }}
                  >
                    {successMsg}
                  </span>
                </div>
              )}

              {/* 2-column grid on desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <FormField
                  id="profile_name"
                  label="Full Name"
                  icon={<User size={13} />}
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
                  icon={<Phone size={13} />}
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
                  icon={<MapPin size={13} />}
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
                  icon={<CreditCard size={13} />}
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
              </div>

              {/* Divider */}
              <div
                className="h-px w-full mb-5"
                style={{ background: "rgba(255,255,255,0.07)" }}
              />

              {/* Identity Verification */}
              <div className="flex items-center gap-2 mb-4">
                <IdCard size={15} style={{ color: GREEN }} />
                <h2
                  className="text-sm font-bold tracking-wider"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  IDENTITY VERIFICATION
                </h2>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(248,113,113,0.12)",
                    color: "#f87171",
                    border: "1px solid rgba(248,113,113,0.25)",
                  }}
                >
                  At least one required
                </span>
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(0,230,118,0.08)",
                }}
              >
                <div className="mb-4">
                  <label
                    htmlFor="profile_aadhar"
                    className="block mb-2 text-sm font-semibold"
                    style={{ color: "rgba(255,255,255,0.65)" }}
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
                    className="text-xs font-semibold"
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
                    className="block mb-2 text-sm font-semibold"
                    style={{ color: "rgba(255,255,255,0.65)" }}
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

              {/* Save Button */}
              <button
                type="button"
                data-ocid="profile.save_button"
                onClick={handleSave}
                disabled={saveDisabled}
                className="w-full mt-6 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                style={{
                  background: saveDisabled
                    ? "rgba(0,230,118,0.25)"
                    : "linear-gradient(135deg, #00E676 0%, #00ff90 55%, #00E676 100%)",
                  color: saveDisabled ? "rgba(0,0,0,0.4)" : "#000000",
                  cursor: saveDisabled ? "not-allowed" : "pointer",
                  boxShadow: saveDisabled ? "none" : `0 0 20px ${GREEN}40`,
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
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
