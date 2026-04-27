import { Injectable } from '@nestjs/common';

// ✅ DEFINE TYPE
type PostType = {
  id: number;
  text: string;
  image?: string | null;
};

// ✅ TYPE THE ARRAY
let posts: PostType[] = [];
let idCounter = 1;

@Injectable()
export class PostsService {
  getAll() {
    return posts;
  }

  create(data: any) {
    const post: PostType = {
      id: idCounter++,
      text: data.text,
      image: data.image || null,
    };

    posts.unshift(post);
    return post;
  }

  delete(id: number) {
    posts = posts.filter(p => p.id !== Number(id));
  }

  update(id: number, body: any) {
    const post = posts.find(p => p.id === Number(id));

    if (post) {
      post.text = body.text;
    }

    return post;
  }
}