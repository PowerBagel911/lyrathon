import { api } from "~/trpc/server";

export async function LatestPost() {
  const post = await api.post.getLatest.query();

  if (!post) {
    return <div className="text-sm text-white/70">No posts yet.</div>;
  }

  return (
    <div className="text-lg font-semibold text-white">
      Latest: {post.name}
    </div>
  );
}
