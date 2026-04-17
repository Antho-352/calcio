import { GraphQLClient } from 'graphql-request';

// Initialize GraphQL client
const endpoint = import.meta.env.WORDPRESS_GRAPHQL_URL || 'https://wp.vai-calcio.fr/graphql';

export const graphQLClient = new GraphQLClient(endpoint, {
  headers: {},
});

// Types
export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  modified: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  };
  categories?: {
    nodes: Category[];
  };
  tags?: {
    nodes: Tag[];
  };
  seo?: {
    title: string;
    metaDesc: string;
    opengraphImage?: {
      sourceUrl: string;
    };
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  count: number;
}

// Queries

/**
 * Get posts with pagination
 */
export async function getPosts(limit = 10, offset = 0): Promise<{ posts: Post[]; total: number }> {
  const query = `
    query GetPosts($limit: Int!, $offset: Int!) {
      posts(
        first: $limit
        where: { offsetPagination: { offset: $offset }, orderby: { field: DATE, order: DESC } }
      ) {
        nodes {
          id
          title
          slug
          excerpt
          date
          modified
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
          categories {
            nodes {
              id
              name
              slug
            }
          }
          tags {
            nodes {
              id
              name
              slug
            }
          }
          seo {
            title
            metaDesc
            opengraphImage {
              sourceUrl
            }
          }
        }
        pageInfo {
          offsetPagination {
            total
          }
        }
      }
    }
  `;

  const data: any = await graphQLClient.request(query, { limit, offset });
  return {
    posts: data.posts.nodes,
    total: data.posts.pageInfo.offsetPagination.total,
  };
}

/**
 * Get single post by slug
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const query = `
    query GetPostBySlug($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        id
        title
        slug
        excerpt
        content
        date
        modified
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            id
            name
            slug
          }
        }
        tags {
          nodes {
            id
            name
            slug
          }
        }
        seo {
          title
          metaDesc
          opengraphImage {
            sourceUrl
          }
        }
      }
    }
  `;

  const data: any = await graphQLClient.request(query, { slug });
  return data.post;
}

/**
 * Get all post slugs for static generation
 */
export async function getAllPostSlugs(): Promise<string[]> {
  const query = `
    query GetAllPostSlugs {
      posts(first: 1000) {
        nodes {
          slug
        }
      }
    }
  `;

  const data: any = await graphQLClient.request(query);
  return data.posts.nodes.map((post: { slug: string }) => post.slug);
}

/**
 * Get posts by category
 */
export async function getPostsByCategory(
  categorySlug: string,
  limit = 10,
  offset = 0
): Promise<{ posts: Post[]; total: number }> {
  const query = `
    query GetPostsByCategory($categorySlug: String!, $limit: Int!, $offset: Int!) {
      posts(
        first: $limit
        where: {
          offsetPagination: { offset: $offset }
          orderby: { field: DATE, order: DESC }
          categoryName: $categorySlug
        }
      ) {
        nodes {
          id
          title
          slug
          excerpt
          date
          modified
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
          categories {
            nodes {
              id
              name
              slug
            }
          }
          seo {
            title
            metaDesc
            opengraphImage {
              sourceUrl
            }
          }
        }
        pageInfo {
          offsetPagination {
            total
          }
        }
      }
    }
  `;

  const data: any = await graphQLClient.request(query, { categorySlug, limit, offset });
  return {
    posts: data.posts.nodes,
    total: data.posts.pageInfo.offsetPagination.total,
  };
}

/**
 * Get posts by tag
 */
export async function getPostsByTag(
  tagSlug: string,
  limit = 10,
  offset = 0
): Promise<{ posts: Post[]; total: number }> {
  const query = `
    query GetPostsByTag($tagSlug: String!, $limit: Int!, $offset: Int!) {
      posts(
        first: $limit
        where: {
          offsetPagination: { offset: $offset }
          orderby: { field: DATE, order: DESC }
          tag: $tagSlug
        }
      ) {
        nodes {
          id
          title
          slug
          excerpt
          date
          modified
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
          categories {
            nodes {
              id
              name
              slug
            }
          }
          seo {
            title
            metaDesc
            opengraphImage {
              sourceUrl
            }
          }
        }
        pageInfo {
          offsetPagination {
            total
          }
        }
      }
    }
  `;

  const data: any = await graphQLClient.request(query, { tagSlug, limit, offset });
  return {
    posts: data.posts.nodes,
    total: data.posts.pageInfo.offsetPagination.total,
  };
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
  const query = `
    query GetCategories {
      categories(first: 100) {
        nodes {
          id
          name
          slug
          count
        }
      }
    }
  `;

  const data: any = await graphQLClient.request(query);
  return data.categories.nodes;
}

/**
 * Get all tags
 */
export async function getTags(): Promise<Tag[]> {
  const query = `
    query GetTags {
      tags(first: 100) {
        nodes {
          id
          name
          slug
          count
        }
      }
    }
  `;

  const data: any = await graphQLClient.request(query);
  return data.tags.nodes;
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const query = `
    query GetCategoryBySlug($slug: ID!) {
      category(id: $slug, idType: SLUG) {
        id
        name
        slug
        count
      }
    }
  `;

  const data: any = await graphQLClient.request(query, { slug });
  return data.category;
}

/**
 * Get tag by slug
 */
export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const query = `
    query GetTagBySlug($slug: ID!) {
      tag(id: $slug, idType: SLUG) {
        id
        name
        slug
        count
      }
    }
  `;

  const data: any = await graphQLClient.request(query, { slug });
  return data.tag;
}
