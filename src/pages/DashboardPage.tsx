export function DashboardPage() {
  return (
    <div className="page">
      <header className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of the GitUsers workflow</p>
      </header>

      <div className="panel">
        <h3>What is GitUsers?</h3>
        <p className="prose">
          GitUsers is a two-step tool: first scrape GitHub developers who have a public
          email, then send them a message via Gmail. All data is stored in PostgreSQL.
        </p>
      </div>

      <div className="steps-grid">
        <StepCard
          num="1"
          title="Scraping Setting"
          description="Save your GitHub personal access token in the tokens table. Run the scraper to collect US-based GitHub users (2022+) with a public email into the users table."
        />
        <StepCard
          num="2"
          title="Sending Message"
          description="Set Gmail credentials, edit subject and body, then send in batches. Sent addresses are stored in sent_mails so the next run skips them."
        />
        <StepCard
          num="3"
          title="PostgreSQL"
          description="Run database/schema.sql to create tokens, users, and sent_mails. Set DATABASE_URL in backend/.env."
        />
      </div>
    </div>
  );
}

function StepCard({
  num,
  title,
  description,
}: {
  num: string;
  title: string;
  description: string;
}) {
  return (
    <div className="step-card">
      <span className="step-num">{num}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
