/**
 * About.jsx - About page component
 *
 * Professional bio emphasizing:
 * - Career trajectory through NJ Transit, private sector, NYC DCAS
 * - Commitment to sustainability and public sector work
 * - Professional background and expertise
 */

import { usePageTitle } from '../hooks/usePageTitle';

function About() {
  // Set page title
  usePageTitle('About');
  return (
    <div className="main-content">
      <div className="container about-content">
        <h1>About</h1>
        
        {/* Professional bio section */}
        <section className="bio-section">
          <h2>Who I Am</h2>
          <p>
            I am currently a Senior Program Manager for GHG Accounting at the 
            New York City Department of Citywide Administrative Services (DCAS), 
            where I focus on measuring, reporting, and reducing greenhouse gas 
            emissions across city operations. My work centers on developing 
            robust accounting frameworks and data-driven strategies to support 
            New York City's ambitious climate goals.
          </p>
          
          <p>
            Prior to joining DCAS, I worked at NJ Transit, where I gained 
            extensive experience in public transportation planning and operations. 
            This role deepened my understanding of the critical intersection 
            between transportation infrastructure, equity, and environmental 
            sustainability. I've also worked in the private sector on 
            sustainability consulting, helping organizations measure and 
            reduce their environmental impacts.
          </p>
        </section>
        
        {/* Mission/purpose section */}
        <section className="bio-section">
          <h2>What Drives Me</h2>
          <p>
            Throughout my career, I've been driven by a commitment to bettering 
            the public good through evidence-based approaches to sustainability. 
            I believe that effective public policy and planning must be grounded 
            in rigorous science, transparent data, and a genuine commitment to 
            serving communities equitably.
          </p>
          
          <p>
            publicpresence.org serves as a platform to explore ideas at the
            intersection of sustainability science, public planning, policy,
            and transportation. Through this blog, I aim to share insights from
            my work, discuss emerging research and best practices, and contribute
            to broader conversations about building more sustainable and equitable
            public systems.
          </p>
        </section>
        
        {/* Areas of focus */}
        <section className="bio-section">
          <h2>Areas of Focus</h2>
          <div>
            <p>
              <strong>Greenhouse Gas Accounting:</strong> Developing methodologies
              for measuring and tracking emissions across complex public sector
              operations
            </p>
            <p>
              <strong>Public Transportation:</strong> Planning and policy for
              sustainable, equitable transit systems
            </p>
            <p>
              <strong>Sustainability Science:</strong> Applying research and
              data analysis to environmental challenges
            </p>
            <p>
              <strong>Public Policy:</strong> Evidence-based policy development
              for climate action and sustainability
            </p>
            <p>
              <strong>Urban Planning:</strong> Creating resilient, sustainable
              cities through integrated planning approaches
            </p>
          </div>
        </section>
        
        {/* Contact/connect section */}
        <section className="bio-section">
          <h2>Connect</h2>
          <p>
            The views expressed on this site are my own and do not necessarily
            reflect those of my employer or any other organization.
          </p>

          <p>
            You can connect with me on:
          </p>
          <ul>
            <li><a href="https://www.linkedin.com/in/harrisonrweiss1/" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            <li><a href="https://github.com/harryw1" target="_blank" rel="noopener noreferrer">GitHub</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default About;
