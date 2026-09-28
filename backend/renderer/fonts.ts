import { loadFont as inter } from '@remotion/google-fonts/Inter';
import { loadFont as poppins } from '@remotion/google-fonts/Poppins';
import { loadFont as montserrat } from '@remotion/google-fonts/Montserrat';
import { loadFont as anton } from '@remotion/google-fonts/Anton';
import { loadFont as bebas } from '@remotion/google-fonts/BebasNeue';
import { loadFont as bangers } from '@remotion/google-fonts/Bangers';
import { loadFont as rubik } from '@remotion/google-fonts/Rubik';
import { loadFont as playfair } from '@remotion/google-fonts/PlayfairDisplay';
import { loadFont as marker } from '@remotion/google-fonts/PermanentMarker';
import { loadFont as unbounded } from '@remotion/google-fonts/Unbounded';
import { loadFont as outfit } from '@remotion/google-fonts/Outfit';
import { loadFont as oswald } from '@remotion/google-fonts/Oswald';
import { loadFont as loadLocalFont } from '@remotion/fonts';
import { staticFile } from 'remotion';
import type { FontFamily } from '../../shared/captions';

// Gilroy is licensed separately; its files are served from shared/fonts (the bundle's publicDir).
loadLocalFont({ family: 'Gilroy', url: staticFile('gilroy/Gilroy-Medium.ttf'), weight: '500' });
loadLocalFont({ family: 'Gilroy', url: staticFile('gilroy/Gilroy-Semibold.ttf'), weight: '600' });

const subsets = ['latin', 'latin-ext'] as any;

// Same families and weights the mobile app bundles (see shared FONTS).
export const CSS_FONT: Record<FontFamily, string> = {
  Gilroy: 'Gilroy',
  Inter: inter('normal', { weights: ['600', '800'], subsets }).fontFamily,
  Poppins: poppins('normal', { weights: ['700', '800'], subsets }).fontFamily,
  Montserrat: montserrat('normal', { weights: ['800', '900'], subsets }).fontFamily,
  Anton: anton('normal', { weights: ['400'], subsets }).fontFamily,
  BebasNeue: bebas('normal', { weights: ['400'], subsets }).fontFamily,
  Bangers: bangers('normal', { weights: ['400'], subsets }).fontFamily,
  Rubik: rubik('normal', { weights: ['800'], subsets }).fontFamily,
  PlayfairDisplay: playfair('italic', { weights: ['700'], subsets }).fontFamily,
  // Only ships "latin", which still covers ‘ and ’ (U+2018/2019) used in Uzbek.
  PermanentMarker: marker('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily,
  Unbounded: unbounded('normal', { weights: ['800'], subsets }).fontFamily,
  Outfit: outfit('normal', { weights: ['700', '800'], subsets }).fontFamily,
  Oswald: oswald('normal', { weights: ['700'], subsets }).fontFamily,
};
