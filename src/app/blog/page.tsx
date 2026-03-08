import PostsWithSearch from "@/components/PostsWithSearch";
import { getPosts } from "@/lib/posts";

export default async function BlogPage() {
  const posts = (await getPosts())
    .filter((post) => !post.draft)
    .sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

  return (
    <article className="mt-8 flex flex-col gap-8 pb-16">
      <h1 className="title">blog.</h1>
      <PostsWithSearch posts={posts} />
    </article>
  );
}
