import React from "react";
import { Link } from "react-router-dom";
import { User, ArrowRight, ShieldCheck } from "lucide-react";
import DeviceConflictModal from "../../system/Sync/DeviceConflictModal";
import SecurePasswordInput from "../components/SecurePasswordInput";
import AuthLayout from "../components/AuthLayout";
import AuthAlert from "../components/AuthAlert";
import AuthInput from "../components/AuthInput";
import { useLoginForm } from "../hooks/useLoginForm";
import { Button } from "@/components/shared/Button";

interface LoginProps {
  isAdmin?: boolean;
}

const Login: React.FC<LoginProps> = ({ isAdmin = false }) => {
  const { form, onSubmit, isLoading, isError, message, deviceConflict, reset } =
    useLoginForm();
  const {
    register,
    formState: { errors },
    watch,
  } = form;

  return (
    <AuthLayout
      title={isAdmin ? "Super Admin Console" : "Enterprise Access"}
      subtitle={isAdmin ? "Restricted System Access" : "Welcome back, Partner."}
      secondarySubtitle={
        isAdmin
          ? "authorized personnel only"
          : "Sign in to your workspace securely"
      }
      description={
        isAdmin
          ? "Secure access for system administration. All actions are logged and audited for compliance."
          : "Manage your business operations, inventory, and analytics in a secure and professional environment."
      }
    >
      {/* Error Alert */}
      {isError && (
        <AuthAlert
          type="error"
          title="Authentication Failed"
          message={message}
        />
      )}

      <form className="mt-8 space-y-6" onSubmit={onSubmit} noValidate>
        <div className="space-y-5">
          <AuthInput
            id="username"
            label="User ID"
            type="text"
            autoComplete="username"
            placeholder="Textilesoft user ID"
            icon={User}
            registration={register("username")}
            error={errors.username?.message}
          />

          <SecurePasswordInput
            id="password"
            label="Security Key"
            placeholder="••••••••••••"
            registration={register("password")}
            error={errors.password?.message}
          />
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                {...register("rememberMe")}
                className="peer h-5 w-5 rounded-lg border-default bg-card text-primary focus:ring-primary/50 transition-all cursor-pointer appearance-none border-2 checked:bg-primary checked:border-primary"
              />
              <ShieldCheck className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 w-3.5 h-3.5 text-white left-0.5" />
            </div>
            <label
              htmlFor="rememberMe"
              className="text-[10px] font-bold text-muted uppercase tracking-widest group-hover:text-main transition-colors cursor-pointer group-hover:opacity-100"
            >
              Remember Access
            </label>
          </div>

          <div className="text-[10px] font-bold text-muted uppercase tracking-widest">
            Same login as Textilesoft
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-cyber-primary w-full h-14 !rounded-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Authenticate Access <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 pt-8 border-t border-default text-center">
        {!isAdmin && (
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
            New user or forgot password? Ask the shop admin to set it up in
            Textilesoft.
          </p>
        )}
        {isAdmin && (
          <Link
            to="/"
            className="text-[10px] font-bold text-muted hover:text-main uppercase tracking-widest transition-colors flex items-center justify-center gap-2 hover:opacity-100"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to System
            Login
          </Link>
        )}
      </div>

      {/* Device Conflict Modal */}
      {deviceConflict && (
        <DeviceConflictModal
          email={watch("username")}
          password={watch("password")}
          onClose={() => reset()}
        />
      )}
    </AuthLayout>
  );
};

export default Login;
