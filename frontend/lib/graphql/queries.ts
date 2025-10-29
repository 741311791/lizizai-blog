import { gql } from '@apollo/client';

export const GET_ARTICLES = gql`
  query GetArticles($limit: Int, $start: Int, $sort: [String]) {
    articles(
      pagination: { limit: $limit, start: $start }
      sort: $sort
      publicationState: LIVE
    ) {
      data {
        id
        attributes {
          title
          subtitle
          slug
          excerpt
          publishedAt
          likes
          views
          featuredImage {
            data {
              attributes {
                url
                alternativeText
              }
            }
          }
          author {
            data {
              attributes {
                name
                avatar {
                  data {
                    attributes {
                      url
                    }
                  }
                }
              }
            }
          }
          category {
            data {
              attributes {
                name
                slug
              }
            }
          }
        }
      }
      meta {
        pagination {
          total
          page
          pageSize
          pageCount
        }
      }
    }
  }
`;

export const GET_ARTICLE_BY_SLUG = gql`
  query GetArticleBySlug($slug: String!) {
    articles(filters: { slug: { eq: $slug } }) {
      data {
        id
        attributes {
          title
          subtitle
          slug
          content
          excerpt
          publishedAt
          likes
          views
          readTime
          featuredImage {
            data {
              attributes {
                url
                alternativeText
              }
            }
          }
          author {
            data {
              attributes {
                name
                bio
                avatar {
                  data {
                    attributes {
                      url
                    }
                  }
                }
              }
            }
          }
          category {
            data {
              attributes {
                name
                slug
              }
            }
          }
          seo {
            metaTitle
            metaDescription
            keywords
          }
        }
      }
    }
  }
`;

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      data {
        id
        attributes {
          name
          slug
          description
        }
      }
    }
  }
`;

export const SUBSCRIBE_NEWSLETTER = gql`
  mutation SubscribeNewsletter($email: String!) {
    createNewsletter(data: { email: $email, status: "active" }) {
      data {
        id
        attributes {
          email
          status
        }
      }
    }
  }
`;

export const INCREMENT_ARTICLE_LIKES = gql`
  mutation IncrementArticleLikes($id: ID!, $likes: Int!) {
    updateArticle(id: $id, data: { likes: $likes }) {
      data {
        id
        attributes {
          likes
        }
      }
    }
  }
`;
