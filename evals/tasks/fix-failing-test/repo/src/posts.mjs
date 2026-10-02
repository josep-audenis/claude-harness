import { slugify } from './slugify.mjs';

export function postPath(post) {
  return `/blog/${slugify(post.title)}`;
}
