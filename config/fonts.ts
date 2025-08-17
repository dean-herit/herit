import {
  Fira_Code as FontMono,
  Inter as FontSans,
  Dancing_Script,
  Great_Vibes,
  Pacifico,
  Satisfy,
  Allura,
  Parisienne,
  Sacramento,
  Shadows_Into_Light,
  Mr_Dafoe,
  Alex_Brush,
} from "next/font/google";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
});

// Signature fonts
export const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

export const greatVibes = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-great-vibes",
  weight: "400",
});

export const pacifico = Pacifico({
  subsets: ["latin"],
  variable: "--font-pacifico",
  weight: "400",
});

export const satisfy = Satisfy({
  subsets: ["latin"],
  variable: "--font-satisfy",
  weight: "400",
});

export const allura = Allura({
  subsets: ["latin"],
  variable: "--font-allura",
  weight: "400",
});

export const parisienne = Parisienne({
  subsets: ["latin"],
  variable: "--font-parisienne",
  weight: "400",
});

export const sacramento = Sacramento({
  subsets: ["latin"],
  variable: "--font-sacramento",
  weight: "400",
});

export const shadowsIntoLight = Shadows_Into_Light({
  subsets: ["latin"],
  variable: "--font-shadows-into-light",
  weight: "400",
});

export const mrDafoe = Mr_Dafoe({
  subsets: ["latin"],
  variable: "--font-mr-dafoe",
  weight: "400",
});

export const alexBrush = Alex_Brush({
  subsets: ["latin"],
  variable: "--font-alex-brush",
  weight: "400",
});

export const signatureFonts = [
  {
    name: "Dancing Script",
    font: dancingScript,
    className: "font-dancing-script",
  },
  { name: "Great Vibes", font: greatVibes, className: "font-great-vibes" },
  { name: "Pacifico", font: pacifico, className: "font-pacifico" },
  { name: "Satisfy", font: satisfy, className: "font-satisfy" },
  { name: "Allura", font: allura, className: "font-allura" },
  { name: "Parisienne", font: parisienne, className: "font-parisienne" },
  { name: "Sacramento", font: sacramento, className: "font-sacramento" },
  {
    name: "Shadows Into Light",
    font: shadowsIntoLight,
    className: "font-shadows-into-light",
  },
  { name: "Mr Dafoe", font: mrDafoe, className: "font-mr-dafoe" },
  { name: "Alex Brush", font: alexBrush, className: "font-alex-brush" },
];
