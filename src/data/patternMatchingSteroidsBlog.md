---
layout: post
title: "Pattern Matching On Steroids: Searching Patterns In Billions Of Characters(With Fuzzy Matching)"
date: 2025-08-20
author: "Anirudh Singh"
excerpt: "Dive into the world of high-performance pattern matching where we tackle two real-world bioinformatics challenges: exact sequence matching across a billion characters, and fuzzy pattern matching with 2-3% tolerance."
tags: ["algorithms", "automata-theory", "fft", "text-processing", "aho-corasick", "interactive"]
category: "algorithms"
reading_time: 30
featured: true
published: true
difficulty: "intermediate"
related_demos: ["trie", "aho-corasick", "slide-multiply", "signal", "fft"]
---
## Introduction

Picture this: you're a computer scientist working at a fancy biotech company, sipping your third coffee of the morning, when you're presented with a problem that makes you question your life choices.

"We have two little problems for you," they say.

*Little problems.* Alright.

**Problem 1:** We have around 10,000 small DNA sequences, each about 100 bases long, and we need to find them in a sequence that's 10^9 characters long. Oh, and since these are small sequences, we want exact matches—no room for errors.

**Problem 2:** Our new Oxford Nanopore tech just spit out a read of 100,000 bases, and we need to match it against that same 10^9 sequence. But since this is a big read, we can tolerate 2-5% mismatches.

<div class="reality-check-box">
<strong>Reality Check:</strong> While these numbers are made up for this blog, they're actually very realistic in biotech! In genomics, you often have millions of short reads (100–300 bases) from sequencing, and you need to align them to a large genome (human ~3×10⁹ bases). Oxford Nanopore indeed produces long noisy reads (~10⁴–10⁵ bases). Since these reads are noisy, we need to account for a 2–3% error rate, which is why fuzzy matching with tolerance for mismatches is essential.
</div>

<style>
.reality-check-box {
    background-color: #f5f5f5 !important;
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid #666 !important;
    margin: 1rem 0;
    color: inherit !important;
}

/* Explicit light mode */
@media (prefers-color-scheme: light) {
    .reality-check-box {
        background-color: #f5f5f5 !important;
        border-left-color: #666 !important;
        color: inherit !important;
    }
}

/* Dark mode only */
@media (prefers-color-scheme: dark) {
    .reality-check-box {
        background-color: #374151 !important;
        border-left-color: #9ca3af !important;
        color: #f3f4f6 !important;
    }
}

/* Fallback for explicit dark theme classes */
[data-theme="dark"] .reality-check-box,
.dark .reality-check-box {
    background-color: #374151 !important;
    border-left-color: #9ca3af !important;
    color: #f3f4f6 !important;
}

/* Explicit light theme classes */
[data-theme="light"] .reality-check-box,
.light .reality-check-box {
    background-color: #f5f5f5 !important;
    border-left-color: #666 !important;
    color: inherit !important;
}
</style>

Alright, let me translate this into something my CS brain can handle. We have a string of a billion characters, and we need to do two things:

1. **Search for 10,000 patterns** of length 100 in a 10^9 character long string
2. **Search for a single pattern** of length 100,000 in a 10^9 character long string with 2-5% mismatches allowed

Let me make this concrete with examples:

**Problem 1:** Imagine a 1 billion character long string like:
```
AGTCCGATCGTAGCTACGTAGCTACGTACGTACGTACGTACG...
```

And a dictionary of 10,000 patterns, each around 100 characters long:
```
AGTCCGATCGTAGCTACGTAGCTACGTACGTACGTACGTACG...  (pattern 1)
GTCCGATCGTAGCTACGTAGCTACGTACGTACGTACGTACGA...  (pattern 2)
TCCGATCGTAGCTACGTAGCTACGTACGTACGTACGTACGAT...  (pattern 3)
...
```

For each pattern in our dictionary, we need to find **exactly** where in this 1 billion string these patterns appear. No mismatches allowed.

**Problem 2:** Instead of a dictionary, we have one huge pattern of 100,000 characters:
```
AGTCCGATCGTAGCTACGTAGCTACGTACGTACGTACGTACG...  (continues for 100k chars)
```

We need to find where in our 1 billion string this pattern is present, but here's the thing: we also need to check where "almost" this pattern is present. So if in some places there's a `G` instead of `A` or a `T` instead of `C`, but the rest of the pattern aligns (around 97% of characters match), we'll consider it a match.

Simple, right? Just like finding a needle in a haystack, except the haystack is the size of a small country and you're looking for thousands of needles.

Let's start with the classic approach that every computer scientist learns in their first algorithms class: brute force! The "align and check" method that's so simple, it's almost beautiful.

For one pattern, we just align it at every position and see if it matches. This gives us `pattern_length × text_length` operations.

Let's do the math for the first problem:
- 10,000 patterns × 100 characters × 10^9 text length = **10^15 operations**

A modern computer can do roughly 10^8 operations per second, so:
- 10^15 ÷ 10^8 = 10^7 seconds
- 10^7 seconds = **116 days**

*116 days.* That's longer than most people's summer vacations. That's longer than some relationships. That's definitely longer than anyone will wait for results.

Now let's see for the other problem, this one's a bit more manageable (relatively speaking):
- 10^9 text length × 10^5 pattern length = **10^14 operations**
- 10^14 ÷ 10^8 = 10^6 seconds = **11.6 days**

Eleven and a half days. Still bad, but at least it's not measured in months. People might actually wait for this one. But it's still bad.

Okay, so brute force is out. But wait—Is there something that I learnt while doing my Data Structures and Algorithms! Surely there's something useful there(otherwise what's the point)?

I know the KMP algorithm! That piece of algorithmic elegance that does pattern matching in O(n+m) time. That's linear time! That's amazing!

...except it only handles one pattern at a time, and it doesn't do fuzzy matching. It's like having a Ferrari that only works on perfectly paved roads and can only carry one passenger.

So here I am, with a problem that's way bigger than what my prep for this job covered. We're talking about processing billions of characters against thousands of patterns, with some needing fuzzy matching. This is definitely not your typical "find a word in a paragraph" homework problem.

What do I do now?

*Let me just run the brute force while I think of better solutions...*

## Experimenting with Trie
 
So I'm sitting there, watching my CPU slowly die, when I remembered something from my college days. There's this data structure called a trie — basically a tree where each path from root to leaf spells out a word.

But let me explain this properly because it's actually brilliant.

Imagine you have words like "CAT", "CAR", and "CARD". Instead of storing them separately, a trie builds a tree where they share common prefixes:

```
       ROOT
        |
        C
        |
        A
       / \
      R   T
      |   |
      ∅   ∅  (∅ means "end of word")
      |
      D
      |
      ∅
```

The magic happens when we search. Instead of checking "CAT", then "CAR", then "CARD" separately against our text, we walk through the text once and follow paths in the trie. When we see 'C', we go down the 'C' branch. Then 'A', down the 'A' branch. Then 'T'? We hit an end marker — boom, found "CAT"! But what if it was 'R' instead? We keep going and might find "CAR" or "CARD".

And then it hit me: "Wait, what if instead of checking each DNA sequence separately, I build one massive tree containing all 10,000 sequences and just walk through the billion-character string once?"

This is where things start getting interesting. Here's an interactive demo, but let's make it relevant to our problem. Instead of random words, let's use DNA-like sequences:
 
:::demo-trie
defaultSequences: ["ATCG", "ATCGA", "ATCGAT"]
:::
 
Pretty neat, right? You can see how sequences like "ATCG", "ATCGA", and "ATCGAT" share the common prefix "ATCG" and the trie automatically reuses those nodes. That's memory efficiency in action!

Now imagine scaling this up to our actual problem: 10,000 DNA sequences stored in one massive trie. Instead of checking each sequence individually against our billion-character string, we walk through the string once, character by character, following paths in the trie.

Simple, right?
 
Well... no. Not really.

 
## Wait, There's a Problem

Now here's the thing about tries: they're amazing for checking if a word exists in a dictionary. Got a word? Walk down the trie, hit an end marker, boom, it's there. Beautiful.

But our problem is different. We're not asking "does this word exist?" We're asking "does our billion-character DNA sequence contain any of these 10,000 patterns?" And that's where tries get... problematic.

Let me walk you through what actually happens when you use a basic trie for text searching. Say we've got DNA sequences "ATCGA" and "TCGAT" in our dictionary, and we're searching through the text "ATCGC".

Here's how it plays out:
1. Start at root
2. See 'A' → follow 'A' path
3. See 'T' → follow 'T' path  
4. See 'C' → follow 'C' path
5. See 'G' → follow 'G' path
6. See 'C' → **no 'C' transition available from this node**
7. Back to root we go

But hold on. We just processed "ATCG" and then gave up when we hit that final 'C'. What about "TCGAT"? That could totally be a match starting from position 2 in our text! But our trie already moved past the 'T' at position 2.

So we're not actually done with those characters. We need to start over from position 2 and check "TCGC", then position 3 and check "CGC", then position 4... you get the idea.

This means we're not really getting that beautiful single-pass behavior we wanted. We're still doing multiple passes, just in a slightly smarter way.

And it gets worse with overlapping gene sequences. Imagine we're looking for both "GAT" and "CGAT" in the text "CGATCG". Our trie will happily find "CGAT" but completely miss that "GAT" was sitting right there in positions 2-4. And we will have to process that position again to catch that pattern.

That's when I realized: the trie is great for dictionary lookups, but for multi-pattern match we need something more powerful.
 
## The Aho-Corasick Method
 
This is where Aho and Corasick showed up in 1975 and basically said, "You know what? Let's fix this properly."

Picture this: you're walking through the trie, following the path for "ATCGA", and suddenly you hit a character that doesn't match. Instead of giving up like a quitter and trudging all the way back to the root, what if the trie could whisper: "Hey, I know you were trying to match 'ATCGA', but look at the last few characters you've seen... 'TCGA'... doesn't that look like the beginning of something else in our dictionary?"

That's the genius of Aho-Corasick. It builds these magical shortcuts called **failure links** that are basically the algorithm's way of saying "this path didn't work out, but here's where you should jump to continue your quest."

Here's how failure links work: Say you're looking for patterns "ATCG" and "TCGA" in the text "ATCGA". You start matching "ATCG" perfectly... A-T-C-G... but then you hit 'A' and there's no path for "ATCGA" in your trie.

Instead of starting over from the beginning, the failure link says: "Wait! Look at what you just read: 'TCGA'. That's exactly the pattern 'TCGA' you're also looking for!" So it instantly jumps you to the end of the "TCGA" pattern match.

Without failure links, you'd miss this overlap completely and would need to start over. With them, you catch every possible match in one pass.

The key insight is that failure links always jump to the **longest matching suffix**. When you've read "ATCG" and hit a dead end, the algorithm looks at all the suffixes of what you've seen: "TCG", "CG", "G". It finds the longest one that's also a prefix of some pattern in your dictionary. In our case, "TCG" is the start of "TCGA", so the failure link jumps you there, and you can immediately continue matching from that point.

So in a way failure links help you save all the progress that you made till this point.

Let me show you how this works with some DNA sequences that actually demonstrate the overlap problem:
 
:::demo-aho-corasick
defaultText: "ATCGATCG"
defaultPatterns: [["TCG", "ATCG"], ["GAT", "CGAT"], ["ATC", "TCGA", "CGAT"]]
:::
 
Try the step-through mode above — it's actually pretty wild to watch. Click on "TCG, ATCG (overlapping!)" and then step through "ATCGATCG". You'll see something happen when the algorithm processes "ATCG" and then hits that final "A". Instead of giving up, it uses a failure link to jump to the "TCG" part of the trie and immediately finds another match!

This is the magic moment where Aho-Corasick shows its true power. A basic trie would have found "ATCG" at position 1 and then started over from position 2, completely missing that "TCG" was hiding at position 2. But with failure links, we catch both patterns in a single sweep.

So what just happened here? The Aho-Corasick automaton solved the fundamental problem with our trie approach. Instead of restarting from scratch every time we hit a dead end, those failure links let us maintain all the progress we've made.

When we're processing "ATCG" and looking for both "TCG" and "ATCG", the failure links ensure we're simultaneously tracking both possibilities. No more missed overlaps, no more multiple passes through the same DNA sequence.
 
The complexity ends up being **O(N + M + Z)** where N is text length, M is total pattern length, and Z is the number of matches. Compare that to:
- Our original nightmare: O(N × M × K) = 1000 trillion operations  
- Aho-Corasick: O(N + M + Z) ≈ 1 billion operations
 
Whether you've got 10 patterns or 10,000 patterns (like in our case), it still processes each character exactly once. That's the kind of scaling that makes you feel good about your algorithmic life choices.
 
So now we can blast through our billion-character DNA sequence, finding all 10,000 patterns in a single pass, catching every overlap and never missing a thing. We've gone from 116 days of computation to something that finishes in under a minute. Pretty solid improvement from where we started.
 
But here's the thing — we still haven't tackled our second problem. We can now find exact matches but what about that 100,000-character Oxford Nanopore read that might have 2-3% errors? How do we find "almost matches" when the DNA might have some mutations or sequencing errors?


## The Fuzzy Matching Problem (Or: When Life Gives You Noisy Data)

So it looks like we're shit out of luck with this next problem. We can't use Aho-Corasick since that's designed for exact matches, and here we are trying to find patterns that are "close enough" but not perfect(not to mention we only have one big pattern).

It seems like all we can do is fall back to our good old sliding window approach: align our pattern at every position, count how many characters match, and see if that's in the acceptable range. Maybe there exists a way to optimize this shit, but let's start simple.

Let me picture this on a smaller scale to wrap my head around it. Let's say we have:

**Text:** `ACGTAACGTAACGA` (this represents our billion-character long string)  
**Pattern:** `CGT` (this represents our 100,000-character pattern, but smaller for sanity)

If we're accepting 1 character mismatch (so 2 out of 3 characters need to match), let's slide our pattern across and count matches at each position:

```
Position 0: ACG vs CGT → 1 match  (C matches C)
Position 1: CGT vs CGT → 3 matches (perfect match!)
Position 2: GTA vs CGT → 1 match  (G matches G)
Position 3: TAA vs CGT → 0 matches
Position 4: AAC vs CGT → 1 match  (C matches C)
Position 5: ACG vs CGT → 1 match  (C matches C)
Position 6: CGT vs CGT → 3 matches (perfect match!)
Position 7: GTA vs CGT → 1 match  (G matches G)
Position 8: TAA vs CGT → 0 matches
Position 9: AAC vs CGT → 1 match  (C matches C)
Position 10: ACG vs CGT → 1 match (C matches C)
Position 11: CGA vs CGT → 2 matches (C and G match!)
```

So our match vector looks like: `[1, 3, 1, 0, 1, 1, 3, 1, 0, 1, 1, 2]`

According to this vector, the positions with values ≥2 are acceptable matches: **positions 1, 6, and 11**. Not bad!

Okay, so we have this process, and we would like to optimize it. Let's try to represent it mathematically—it's always a good practice to bring math into shit because mathematicians have worked really hard to optimize a lot of stuff, and maybe they've already solved our problem without realizing it.


## Converting Character Comparisons to Mathematical Operations

Soooo how can we represent this process mathematically? We need a way to convert the `==` check into some sort of mathematical shit, so that we can write formulas and stuff with this.

So here's an idea.

Let's say we have the text `ACCGTTACGGATTACGA` and a pattern `CGG`. What we can do is take one character at a time and encode it. If the position has that character, we write 1 there; if not, we write 0.

Let's take character `C`. For our text, `C` is present at positions 2, 3, 8, and 14 (using 1-based indexing):

**Text encoding for C:** `Tc = [0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0]`

And for our pattern `CGG`, we have `C` at only the first position:

**Pattern encoding for C:** `Pc = [1, 0, 0]`

Now here's the things, we can do a sliding window approach, but on these encoded binary signals! We slide our pattern across the text, and wherever we see two `1`s aligning (both text and pattern have `1` at the same position), that's a character match. Then we just add up all the aligned `1`s to get the total matches at that position.

Let's do this for character `G` to make it clearer. For our text `ACCGTTACGGATTACGA`, `G` appears at positions 4, 9, 10, and 17:

**Text encoding for G:** `Tg = [0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1]`

And for our pattern `CGG`, we have `G` at positions 2 and 3:

**Pattern encoding for G:** `Pg = [0, 1, 1]`

Now, let me show you what happens when we align our pattern at different positions. When we align at position 3 (comparing text positions 3,4,5 with pattern positions 1,2,3):

- Text segment for G: `[0, 1, 0]` (positions 3,4,5 from Tg)
- Pattern for G: `[0, 1, 1]`
- Element-wise multiplication: `[0×0, 1×1, 0×1] = [0, 1, 0]`
- Sum: `0 + 1 + 0 = 1`

So at position 3, we have 1 matching `G` character. Let me do this for all positions to show you the pattern:

**Position 1:** Text segment `[0, 0, 0]` • Pattern `[0, 1, 1]` = 0  
**Position 2:** Text segment `[0, 0, 1]` • Pattern `[0, 1, 1]` = 1  
**Position 3:** Text segment `[0, 1, 0]` • Pattern `[0, 1, 1]` = 1  
**Position 4:** Text segment `[1, 0, 0]` • Pattern `[0, 1, 1]` = 0  
**Position 5:** Text segment `[0, 0, 0]` • Pattern `[0, 1, 1]` = 0  
**Position 6:** Text segment `[0, 0, 0]` • Pattern `[0, 1, 1]` = 0  
**Position 7:** Text segment `[0, 0, 1]` • Pattern `[0, 1, 1]` = 1  
**Position 8:** Text segment `[0, 1, 1]` • Pattern `[0, 1, 1]` = 2 (both Gs match!)  
**Position 9:** Text segment `[1, 1, 0]` • Pattern `[0, 1, 1]` = 1  
...and so on.

Now here's the beautiful part: this process of matching and adding is exactly like calculating the dot product of that text segment with the pattern!

Let me now do the complete demo with both C and G for a few key positions to show you how this works:

**Position 8 (where pattern CGG aligns with text CGG):**
- For C: Text segment `[1, 0, 0]` • Pattern `[1, 0, 0]` = 1
- For G: Text segment `[0, 1, 1]` • Pattern `[0, 1, 1]` = 2
- **Total matches = 1 + 2 = 3** Perfect match!

**Position 2 (where pattern CGG aligns with text CCG):**
- For C: Text segment `[1, 1, 0]` • Pattern `[1, 0, 0]` = 1
- For G: Text segment `[0, 0, 1]` • Pattern `[0, 1, 1]` = 1
- **Total matches = 1 + 1 = 2** (Close, but not perfect)

So mathematically, the frequency of matches for character `c` when aligning the pattern with position `i` can be given by:

$$
\text{matches}_c(i) = \sum_{j=0}^{|P|-1} T_c[i+j] \times P_c[j]
$$

And the total number of matching characters at position `i` is simply:

$$
\text{total-matches}(i) = \sum_{c \in \{A,T,G,C\}} \sum_{j=0}^{|P|-1} T_c[i+j] \times P_c[j]
$$

Let me show you with a DNA example. We'll slide our pattern across the text and see what happens:
 
:::demo-slide-multiply
defaultText: "ATCGATCG"
defaultPattern: "TCG"
:::

## Wait, This Math Looks Familiar... 

So we've converted our sliding window into this fancy math formula, but now what? Last I checked, this will still be O(N×M) since we're just matching, adding, and sliding. In fact, it's a little worse since now we're processing each character individually.

And you're absolutely right—it is in fact worse if we continue doing the sliding window approach here. The math equation we derived for a single character:

$$
\text{matches}_c(i) = \sum_{j=0}^{|P|-1} T_c[i+j] \times P_c[j]
$$

This sliding-and-multiplying operation? It's almost like something called **convolution**...

In true convolution, we'd actually need to flip our pattern backwards first. So "TCG" would become "GCT", then we'd slide that across. But for pattern matching, we don't want the backwards version—we want to find "TCG", not "GCT"!

What we're actually doing is called **cross-correlation**. It's convolution's cooler cousin that doesn't flip things around.

For those who don't know what convolution is: it's a mathematical operation used heavily in signal processing to measure how much one signal "looks like" another signal at different time shifts. Think of it as asking "how similar are these two signals when I slide one across the other?" 

For continuous signals, the equation uses integration:

$$
(f * g)(t) = \int_{-\infty}^{\infty} f(\tau) \cdot g(t - \tau) \, d\tau
$$

But since we're dealing with discrete sequences (like our DNA strings), we use discrete convolution with summation instead:

$$
(f * g)[n] = \sum_{m=-\infty}^{\infty} f[m] \times g[n - m]
$$

Now, let me rewrite our sequence matching equation in a way that'll make your eyes light up. Look at that inner sum again:

$$
\sum_{j=0}^{|P|-1} T_c[i+j] \times P_c[j]
$$

This is **exactly** the definition of cross-correlation between $T_c$ and $P_c$ at position i! And cross-correlation is just convolution with one signal flipped. If we reverse our pattern $P_c$ to get $P_c^{rev}$, then we can write our operation as a convolution:

$$
\text{matches}_c(i) = (T_c * P_c^{rev})[i]
$$

Where `*` is the convolution operator! So our total matching becomes:

$$
\text{total-matches}(i) = \sum_{c \in \{A,T,G,C\}} (T_c * P_c^{rev})[i]
$$

We just wrote pattern matching as a convolution problem!

But wait, why did signals suddenly show up here? Weren't we dealing with text and DNA sequences, not signals? You're probably thinking: "Signals are for audio and radio waves and stuff. Text is just... text. Letters. Symbols. Not wavy things!"

But here's the thing: the moment we represented text as math using those 0/1 encodings, we converted it into signals!

For example, for a DNA sequence like `AGGCGTA`, we encode G as:
```
G: [0, 1, 1, 0, 1, 0, 0]
```

Now, if we treat the increasing index positions as the flow of time, we get ourselves nice signal-looking things. In fact, that's exactly what a signal is—a bunch of values changing over time.

We can even graph this like signals:

:::demo-signal
defaultSequence: "AGGCGTA"
:::

This interactive visualization shows how DNA sequences are converted to binary signals. Each position in the sequence maps to 1 if it contains 'G', and 0 otherwise. This is a fundamental concept in bioinformatics for pattern matching and sequence analysis.

So text over position is analogous to signals over time. Now what?


## The Frequency Domain (AKA "Let's Change Our Perspective")

Now that we know text can be treated as signals and we need to find convolution, we can use some tricks that mathematicians have already discovered for us over the centuries. 

Right now we have a text "signal" over "time" (position), so we're seeing our signal from the perspective of time. But what if we flip the script and look at this same signal from the perspective of **frequency**?

Now, I know what you're thinking: "Time being analogous to position was already a bit of a stretch, but *frequency* in text? That sounds completely bonkers!" And you're absolutely right—it does sound weird. You could think of it as the frequency of G appearing in the text, but honestly, that's not quite it either.

Here's the beautiful thing about math: **it doesn't care** if our signal is coming from text, audio, radio waves, or your heartbeat monitor. For math, this is just a signal over time, and math will happily transform it to see it from frequency's perspective. It's like putting on different glasses to see the same object from a completely different angle.

But wait—why do we even *want* to do this? You'll understand in a moment, just bear with me!

Math provides us with this magical tool called the **Discrete Fourier Transform (DFT)** which is defined as:

$$
X[k] = \sum_{n=0}^{N-1} x[n] \cdot e^{-j2\pi kn/N}
$$

This transforms our "time domain" signal to "frequency domain". It's math's way of looking at the exact same data from a completely different perspective—like viewing a sculpture from the side instead of the front.

If you don't understand how the transformation itself works, I'd love to explain that, but that's not our mission here. We're here to find patterns in strings (remember that? That's kinda why we started this whole journey!). So all you need to know is that this formula takes our position-based signal and gives us a frequency-based view of the same information.

"Okay, cool math trick," you might say, "but how does this help us find DNA patterns faster?"

Well, here comes the beautiful part! There's this absolutely gorgeous property about convolution that connects both domains. It's called the **Convolution Theorem**, and it says that the Fourier transform of a convolution in the time domain equals the element-wise multiplication of the Fourier transforms of the individual functions:

$$
\mathcal{F}\{f * g\} = \mathcal{F}\{f\} \odot \mathcal{F}\{g\}
$$

In plain English: convolution in time domain = element-wise multiplication in frequency domain.

This means instead of sliding and summing (expensive!), we can just multiply corresponding frequency components together (cheap!).

Which essentially means that if were to calculate this convolution in frequency domain it would mean only doing element wise multiplication which is actually just O(N) time.

And *that* is what we're going to use to make our pattern matching blazingly(sorta) fast!


### But Why Does This Work?
 
<details>
<summary><strong>Click for the full mathematical journey!</strong></summary>
 
<div class="math-details">
 
<h4>Part 1: Setting Up Our Problem</h4>
 
Let's start with what we're actually trying to compute. For pattern matching, at each position $i$ in our text, we want to know how many characters match:
 
$$score[i] = \sum_{j=0}^{|pattern|-1} \mathbb{1}_{text[i+j] = pattern[j]}$$
 
Where $\mathbb{1}$ is the indicator function (1 if true, 0 if false).
 
But we can't FFT this directly because of that pesky equality check. So we use our character signal trick! For each character $c$ in our alphabet:
 
$$text_c[i] = \begin{cases} 1 & \text{if } text[i] = c \\ 0 & \text{otherwise} \end{cases}$$
 
$$pattern_c[j] = \begin{cases} 1 & \text{if } pattern[j] = c \\ 0 & \text{otherwise} \end{cases}$$
 
Now our score becomes:
 
$$score[i] = \sum_{c \in \Sigma} \sum_{j=0}^{|pattern|-1} text_c[i+j] \cdot pattern_c[j]$$
 
This inner sum looks familiar... it's a correlation!
 
<h4>Part 2: From Correlation to Convolution</h4>
 
The correlation of $text_c$ and $pattern_c$ at position $i$ is:
 
$$(text_c \star pattern_c)[i] = \sum_{j=0}^{|pattern|-1} text_c[i+j] \cdot pattern_c[j]$$
 
But FFT works with convolution, not correlation. The convolution is:
 
$$(text_c * pattern_c)[i] = \sum_{j=0}^{|pattern|-1} text_c[j] \cdot pattern_c[i-j]$$
 
Notice the difference? In convolution, one signal is flipped. But here's a trick: correlation is just convolution with one signal reversed!
 
$$(text_c \star pattern_c)[i] = (text_c * \overline{pattern_c})[i]$$
 
Where $\overline{pattern_c}[j] = pattern_c[|pattern|-1-j]$ (the reversed pattern).
 
<h4>Part 3: Enter the Discrete Fourier Transform</h4>
 
The DFT of a signal $x$ of length $N$ is:
 
$$X[k] = \sum_{n=0}^{N-1} x[n] \cdot e^{-i2\pi kn/N}$$
 
Let's break this down:
- $k$ is the frequency index (0 to N-1)
- $e^{-i2\pi kn/N}$ is a complex exponential that rotates $k$ times as $n$ goes from 0 to N-1
- We're decomposing our signal into N different frequencies
 
The inverse DFT is:
 
$$x[n] = \frac{1}{N} \sum_{k=0}^{N-1} X[k] \cdot e^{i2\pi kn/N}$$
 
<h4>Part 4: The Convolution Theorem (The Main Event!)</h4>
 
Here's where the magic happens. Let's prove that convolution in time domain equals element-wise multiplication in frequency domain.
 
Start with the convolution:
 
$$(f * g)[n] = \sum_{m=0}^{N-1} f[m] \cdot g[n-m]$$
 
Take the DFT of both sides:
 
$$\mathcal{F}\{(f * g)\}[k] = \sum_{n=0}^{N-1} \left(\sum_{m=0}^{N-1} f[m] \cdot g[n-m]\right) \cdot e^{-i2\pi kn/N}$$
 
Swap the sums (we can do this because they're finite):
 
$$= \sum_{m=0}^{N-1} f[m] \sum_{n=0}^{N-1} g[n-m] \cdot e^{-i2\pi kn/N}$$
 
Now here's the clever bit. Let $j = n - m$, so $n = j + m$. Note that as $n$ ranges from $0$ to $N-1$ and $m$ is fixed, $j$ also ranges from $-m$ to $N-1-m$. For circular convolution (which is what DFT computes), we use modular arithmetic, so this becomes:
 
$$= \sum_{m=0}^{N-1} f[m] \sum_{j=0}^{N-1} g[j] \cdot e^{-i2\pi k(j+m)/N}$$
 
Split the exponential:
 
$$= \sum_{m=0}^{N-1} f[m] \cdot e^{-i2\pi km/N} \sum_{j=0}^{N-1} g[j] \cdot e^{-i2\pi kj/N}$$
 
But wait! Those are just the DFTs of $f$ and $g$:
 
$$= \left(\sum_{m=0}^{N-1} f[m] \cdot e^{-i2\pi km/N}\right) \cdot \left(\sum_{j=0}^{N-1} g[j] \cdot e^{-i2\pi kj/N}\right)$$
 
$$= F[k] \cdot G[k]$$
 
**And We just proved the convolution theorem!
 
<h4>Part 5: Why This Is Fast (The Complexity Analysis)</h4>
 
Direct convolution:
- For each of N positions, sum over M pattern positions
- Complexity: $O(N \times M)$
 
FFT approach:
1. FFT of text signal: $O(N \log N)$
2. FFT of pattern signal: $O(N \log N)$ (padded to same length)
3. Element-wise multiplication: $O(N)$
4. Inverse FFT: $O(N \log N)$
- Total: $O(N \log N)$
 
The FFT algorithm achieves this speed by using a divide-and-conquer approach, recursively breaking down the DFT computation into smaller subproblems. The implementation details of FFT are beyond the scope of this article, but if you're curious about how it works under the hood, check out this excellent resource: [Fast Fourier Transform on CP-Algorithms](https://cp-algorithms.com/algebra/fft.html).
 
<h4>Part 6: Putting It All Together for Text Matching</h4>
 
For our text matching problem:
 
1. For each character $c$, create binary signals $text_c$ and $pattern_c$
2. Compute $score_c[i] = (text_c \star pattern_c)[i]$ using FFT:
   - $\mathcal{F}\{text_c\}$
   - $\mathcal{F}\{\overline{pattern_c}\}$ (or just conjugate $\mathcal{F}\{pattern_c\}$)
   - Multiply element-wise
   - Inverse FFT
3. Sum over all characters: $score[i] = \sum_{c \in \Sigma} score_c[i]$
4. Positions where $score[i] = |pattern|$ are exact matches!
 
The total complexity is $O(|\Sigma| \cdot N \log N)$ where $|\Sigma|$ is the alphabet size. Since the alphabet is fixed (e.g., 128 for ASCII), this is effectively $O(N \log N)$.
 
<h4>Bonus: The Complex Number Magic</h4>
 
Why do complex numbers make this work? The key is Euler's formula:
 
$$e^{i\theta} = \cos(\theta) + i\sin(\theta)$$
 
So our DFT basis functions $e^{-i2\pi kn/N}$ are actually spinning around the unit circle in the complex plane. Each frequency $k$ spins at a different rate, and the DFT measures how much our signal "resonates" with each spinning frequency.
 
When we multiply element-wise in the frequency domain, we're combining these resonances. The inverse FFT then reconstructs the convolution by adding up all these spinning components with the right phases.
 
It's like... imagine you're trying to predict where two spinning dancers will meet. Instead of tracking their every move (convolution), you can:
1. Figure out how fast each is spinning (FFT)
2. Multiply their spin rates element-wise (frequency domain multiplication)
3. Calculate where they'll meet (inverse FFT)
 
That's the essence of why this beautiful theorem works!
 
</div>
</details>


## The Magic Recipe: FFT-Based Pattern Matching

Alright, let's put all the pieces together and see how this frequency domain magic actually solves our original problem.

Remember, we need to find the convolution to get the number of matches at each position. Here's our game plan:

1. **Transform text signal to frequency domain** using Fourier Transform
2. **Transform pattern signal to frequency domain** using Fourier Transform  
3. **Multiply them element wise** (this is where the convolution theorem shines!)
4. **Transform back to time domain** using Inverse Fourier Transform

And that's that! We get a vector containing the number of character matches at each position.

Let me break this down step by step:

**Step 1 & 2: Into the Frequency Realm**
We take our text signal (like that G signal we saw earlier) and our pattern signal, and transform both using the DFT formula we saw. This converts our position-based signals into frequency-based representations.

**Step 3: The Multiplication Magic**
Instead of doing the expensive convolution in the time domain (which would be O(N×M)), we just multiply the transformed signals element-wise. This is lightning fast—just O(N) operations! The convolution theorem guarantees this gives us exactly what we want.

**Step 4: Back to Reality**
We use the **Inverse Fourier Transform** to convert our result back to the time domain. As the name suggests, it's the reverse operation that brings us back to our familiar position-based world.

The result? A vector where each position tells us exactly how many characters matched when we aligned our pattern at that position! Whether we want 2% error tolerance or 3% error tolerance doesn't matter—we have the exact match count for every position, so we can easily apply any threshold we want.

Seems almost magical, doesn't it? Like we cheated the universe by taking a detour through frequency space!

Now how much time does this whole process actually take?

To calculate the Fourier transform, we use an algorithm called **FFT (Fast Fourier Transform)**. This beautiful algorithm calculates the Fourier transform in O(N log N) time using a divide-and-conquer approach. If you're curious about the nitty-gritty details of how FFT works its magic, you can dive deeper at [cp-algorithms.com](https://cp-algorithms.com/algebra/fft.html).

Let's break down the time complexity:
- **FFT on text**: O(N log N)
- **FFT on pattern**: O(M log M) ≈ O(N log N) (since we pad to same size)
- **Element-wise multiplication**: O(N) (super fast!)
- **Inverse FFT**: O(N log N)

**Total time complexity: O(N log N)**

That's a *massive* improvement over our original O(N×M) brute force approach!

Remember our second bioinformatics problem? We had a 100,000-base pattern to search in a 1-billion-character genome. 

**Before (brute force):** 10^9 × 10^5 = 10^14 operations
- At 10^8 operations per second: 10^14 / 10^8 = 10^6 seconds = **11.6 days**

**After (FFT):** ~10^9 × log(10^9) ≈ 10^9 × 30 ≈ 3×10^10 operations
- At 10^8 operations per second: 3×10^10 / 10^8 = 300 seconds = **5 minutes**

From **11.6 days** to **5 minutes**. That's not just an improvement—that's a complete game changer! We went from "let's schedule this for next week" to "grab a coffee while it runs."

And the best part? This works for *any* error tolerance. Want exact matches? Check positions with full match count. Want 2% tolerance? Check positions with ≥98% match count. Want 5% tolerance? Check positions with ≥95% match count. Same algorithm, different thresholds!


## The Complete FFT Pattern Matching Demo

Alright, enough theory! Let's see this magic in action. This interactive demo will walk you through every single step of the FFT-based pattern matching algorithm. You'll see exactly how we transform text into the frequency domain, multiply signals, and transform back to get our match scores.
:::demo-fft
defaultText: "ATCGATCGATCG"
defaultPattern: "TCGA"
:::

This interactive visualization demonstrates the complete FFT-based pattern matching algorithm. It shows all 7 steps from input processing through signal conversion, FFT transformations, frequency domain multiplication, inverse FFT, and final correlation results. The demo preserves all the mathematical rigor while providing a cleaner, more responsive interface.

---

And there you have it! From the humble beginnings of a brute force search taking 11.6 days, we've journeyed through the mathematical wonderland of signal processing, Fourier transforms, and convolution theory to arrive at an algorithm that can solve the same problem in just 5 minutes.

This isn't just a story about optimization—it's a perfect example of how **mathematical abstractions** can lead to breakthrough solutions. By recognizing that pattern matching(good old sliding window approach) is really just convolution in disguise, and that convolution becomes multiplication in the frequency domain, we unlocked the power of FFT to transform an intractable problem into a manageable one.

Whether you're searching for DNA sequences in massive genomes, finding patterns in time series data, or implementing any kind of template matching, the principles we've explored here will serve you well.


## Conclusion

We went from brute force (11.6 days) to FFT magic (5 minutes) - but this wasn't just about speed.

We explored **trees** (tries), **graphs** (Aho-Corasick automata), and **mathematics** (signal processing). Each taught us something different about algorithmic thinking. And let's take a moment to appreciate that we did the string pattern matching in frequency domain. 

What I want you to take away from this is how very similar looking problems can have extremely different optimal solutions. And we might need to take completely different approaches to solve each of them, maybe even go out of our way a little bit.


Thanks for reading! I hope you've learned something new and caught a glimpse of how trees, graphs, and math can solve problems in unexpected ways. The next time you hit a wall, don't just code harder—think differently!

