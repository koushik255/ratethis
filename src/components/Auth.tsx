import { useAuthActions } from "@convex-dev/auth/react";

export function SignIn() {
  const { signIn } = useAuthActions();
  return (
    <button 
      onClick={() => void signIn("google")}
      className="auth-button"
    >
      sign in
    </button>
  );
}

export function SignOut() {
  const { signOut } = useAuthActions();
  return (
    <button 
      onClick={() => void signOut()}
      className="auth-button"
    >
      sign out
    </button>
  );
}
