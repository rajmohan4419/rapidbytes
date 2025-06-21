import React from 'react';
import IntroBlogPost from '../components/blog/IntroBlogPost';

function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl"> {/* Applied max-width for typical blog readability */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold">Blog</h1>
      </header>
      <IntroBlogPost />
      {/*
        Future structure might involve mapping over an array of post data:
        {posts.map(post => (
          <BlogPostPreview key={post.id} {...post} />
        ))}
      */}
    </div>
  );
}

export default BlogPage;
