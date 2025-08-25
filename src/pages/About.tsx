export default function About() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
            About Beyond Big-O
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Taking you from contest to codebase
          </p>
        </header>

        <div className="prose prose-lg mx-auto">
          <h2>What is this?</h2>
          <p>
            <strong>Beyond Big-O</strong> is a technical blog that explores advanced programming algorithms through the lens of practical software engineering. Each post is a deep dive into the math and engineering behind the algorithms with fun interactive components.
          </p>

          <h2>The Philosophy</h2>
          <p>
            Competitive programming teaches us to think algorithmically and solve complex problems under constraints. But the journey doesn't end at the contest scoreboard. These same algorithmic insights become the building blocks of scalable systems, efficient databases, and intelligent applications.
          </p>
          
          <p>
            This blog explores that connection — showing how contest algorithms evolve into production code, how mathematical elegance translates to engineering excellence, and how competitive programming skills directly enhance software capabilities.
          </p>

          <h2>For whom?</h2>
          <ul>
            <li><strong>Software engineers</strong> wanting to deepen their algorithmic knowledge</li>
            <li><strong>Computer science students</strong> bridging theory and practice</li>
            <li><strong>Anyone curious</strong> about the mathematical beauty underlying modern software</li>
          </ul>

          <h2>About the Author</h2>
          <p>
            Hi! I'm Anirudh Singh, a software engineer passionate about the intersection of competitive programming and real-world software development. I believe that the algorithmic thinking developed through contests directly translates to building better, more efficient software systems.
          </p>

          <h2>Get in touch</h2>
          <p>
            Have questions about a specific algorithm? Want to suggest a topic? Found an error in the math?<br/>
            Email: <a href="mailto:anirudhsingh111100@gmail.com" className="text-primary hover:underline">anirudhsingh111100@gmail.com</a>
          </p>

          <p>
            <em>
            The name reflects that most of us learn DSA and complexity analysis but don't go beyond that. "Beyond Big-O" represents our journey from complexity analysis to real-world impact.
            </em>
          </p>
        </div>
      </div>
    </div>
  );
}