export const adminEmailTemplate = ({
  subject,
  message,
  name,
  buttonText,
  buttonLink,
  unsubscribeLink,
  email,

  // 🔥 NEW (optional)
  spotifyUrl,
  appleUrl,
  stats,
}: {
  subject: string;
  message: string;
  name?: string;
  buttonText?: string;
  buttonLink?: string;
  unsubscribeLink?: string;
  email?: string;

  // 🔥 NEW TYPES
  spotifyUrl?: string;
  appleUrl?: string;
  stats?: {
    plays?: number;
    revenue?: number;
    downloads?: number;
  };
}) => {
  return `
  <div style="font-family: Arial; background:#0b0b0f; padding:40px; color:#e2e8f0;">
    
    <div style="max-width:600px; margin:auto; background:#111827; border-radius:12px; overflow:hidden;">
      
      <!-- HEADER -->
      <div style="padding:25px; background:linear-gradient(135deg,#7c3aed,#dc2626); text-align:center;">
        <h1 style="margin:0; color:white; letter-spacing:2px;">KASUKU</h1>
      </div>

      <!-- BODY -->
      <div style="padding:30px;">
        
        <h2 style="color:#f1f5f9; margin-bottom:10px;">${subject}</h2>

        <p style="color:#94a3b8;">Hey ${name || 'there'} 👋</p>

        <div style="color:#cbd5f5; line-height:1.6;">
          ${message.replace(/\n/g, '<br/>')}
        </div>

        ${
          buttonLink
            ? `
        <!-- MAIN BUTTON -->
        <div style="margin-top:30px;">
          <a href="https://kasuku.com/track-click?email=${email}&url=${encodeURIComponent(buttonLink)}"
             style="display:inline-block; padding:14px 24px; background:linear-gradient(135deg,#7c3aed,#9333ea); color:white; border-radius:10px; text-decoration:none; font-weight:600;">
            ${buttonText || 'Open'}
          </a>
        </div>`
            : ''
        }

        ${
          spotifyUrl || appleUrl
            ? `
        <!-- 🎧 STREAMING LINKS -->
        <div style="margin-top:30px;">
          <p style="color:#94a3b8; margin-bottom:10px;">Listen on:</p>

          ${spotifyUrl ? `
            <a href="${spotifyUrl}" style="margin-right:10px; padding:10px 16px; background:#1DB954; color:white; border-radius:8px; text-decoration:none;">
              Spotify
            </a>
          ` : ''}

          ${appleUrl ? `
            <a href="${appleUrl}" style="padding:10px 16px; background:#fa243c; color:white; border-radius:8px; text-decoration:none;">
              Apple Music
            </a>
          ` : ''}
        </div>`
            : ''
        }

        ${
          stats
            ? `
        <!-- 📊 STATS -->
        <div style="margin-top:30px; padding:20px; background:#020617; border-radius:10px;">
          <p style="margin:0 0 10px 0; color:#94a3b8;">Performance</p>

          <div style="display:flex; justify-content:space-between; font-size:14px;">
            ${stats.plays !== undefined ? `<div>▶ Plays: <b>${stats.plays}</b></div>` : ''}
            ${stats.revenue !== undefined ? `<div>💰 Revenue: <b>$${stats.revenue}</b></div>` : ''}
            ${stats.downloads !== undefined ? `<div>⬇ Downloads: <b>${stats.downloads}</b></div>` : ''}
          </div>
        </div>`
            : ''
        }

      </div>

      <!-- FOOTER -->
      <div style="padding:25px; background:#020617; text-align:center;">
        
        <div style="margin-bottom:10px;">
          <strong style="color:#7c3aed;">Kasuku Platform</strong>
        </div>

        <p style="color:#64748b; font-size:12px;">
          Empowering artists worldwide 🌍
        </p>

        <p style="color:#64748b; font-size:12px;">
          © ${new Date().getFullYear()} Kasuku
        </p>

        ${
          unsubscribeLink
            ? `
        <p style="font-size:12px; margin-top:10px;">
          <a href="${unsubscribeLink}" style="color:#94a3b8;">Unsubscribe</a>
        </p>

        <!-- TRACK OPEN -->
        <img src="https://kasuku.com/track-open?email=${email}" width="1" height="1"/>`
            : ''
        }

      </div>

    </div>
  </div>
  `;
};