import { getCurrentUser } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      {user ? (
        <div>
          <p>Email: {user.email}</p>
          <p>Name: {user.name || "N/A"}</p>
          <p>Role: {user.role}</p>
        </div>
      ) : (
        <p>Not authenticated</p>
      )}
    </div>
  );
}
