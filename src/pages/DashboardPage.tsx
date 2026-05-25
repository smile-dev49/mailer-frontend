import { Link } from "react-router-dom";
import { ROUTES } from "../routes";

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
          GitUsers is a two-step tool: register a GitHub token, scrape developers with
          public emails, then send messages via Gmail. All data is stored in PostgreSQL.
        </p>
      </div>

      <div className="steps-grid">
        <StepCard
          num="1"
          title="Register Token"
          description="Save GitHub token and Gmail address (App password in backend/.env only)."
          link={ROUTES.registerToken}
        />
        <StepCard
          num="2"
          title="Scraping Setting"
          description="Run the scraper to collect US-based GitHub users (2022+) into the users table."
          link={ROUTES.scrapingSetting}
        />
        <StepCard
          num="3"
          title="Sending Message"
          description="Configure Gmail, edit templates, and send mail in batches."
          link={ROUTES.sendingMessage}
        />
        <StepCard
          num="4"
          title="PostgreSQL"
          description="Tables: tokens, users, sent_mails. Configure DATABASE_URL in backend/.env."
        />
      </div>
    </div>
  );
}

function StepCard({
  num,
  title,
  description,
  link,
}: {
  num: string;
  title: string;
  description: string;
  link?: string;
}) {
  return (
    <div className="step-card">
      <span className="step-num">{num}</span>
      <h3>{link ? <Link to={link}>{title}</Link> : title}</h3>
      <p>{description}</p>
    </div>
  );
}
