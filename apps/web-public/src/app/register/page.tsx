import { Suspense } from "react";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-32 pb-20 text-center">
          <p className="text-slate-400">Loading...</p>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
