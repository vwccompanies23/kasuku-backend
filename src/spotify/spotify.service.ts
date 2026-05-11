import axios from 'axios';

export class SpotifyService {
  private accessToken = '';

  async getToken() {
    const res = await axios.post<any>(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(
              process.env.SPOTIFY_CLIENT_ID +
                ':' +
                process.env.SPOTIFY_CLIENT_SECRET
            ).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    this.accessToken = res.data.access_token;
  }

  async searchArtist(name: string) {
    if (!this.accessToken) await this.getToken();

    const res = await axios.get<any>(
      `https://api.spotify.com/v1/search?q=${name}&type=artist&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    return res.data.artists.items.map((a: any) => ({
      name: a.name,
      spotifyId: a.id,
      image: a.images?.[0]?.url || '',
    }));
  }
}