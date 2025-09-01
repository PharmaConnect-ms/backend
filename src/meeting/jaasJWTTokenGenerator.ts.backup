import * as jsonwebtoken from 'jsonwebtoken';

interface UserPayload {
  id: string;
  name: string;
  email: string;
  //avatar: string;
  appId: string;
  kid: string;
}

const generateToken = (
  privateKey: string,
  { id, name, email, appId, kid }: UserPayload
): string | null => {
  const now = new Date();

  try {
    const jwt = jsonwebtoken.sign(
      {
        aud: 'jitsi',
        context: {
          user: {
            id,
            name,
            //avatar,
            email,
            // moderator: 'true'
          },
          features: {
            livestreaming: 'true',
            recording: 'true',
            transcription: 'true',
            'outbound-call': 'true',
          },
        },
        iss: 'chat',
        room: '*',
        sub: appId,
        exp: Math.round(now.setHours(now.getHours() + 3) / 1000),
        nbf: Math.round(Date.now() / 1000) - 10,
      },
      privateKey,
      {
        algorithm: 'RS256',
        keyid: kid,
      }
    );

    return jwt;
  } catch (error: any) {
    console.error('Error generating token:', error.message);
    return null;
  }
};

export default generateToken;
