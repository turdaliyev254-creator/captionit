import { useFonts } from 'expo-font';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { Poppins_800ExtraBold } from '@expo-google-fonts/poppins/800ExtraBold';
import { Montserrat_800ExtraBold } from '@expo-google-fonts/montserrat/800ExtraBold';
import { Montserrat_900Black } from '@expo-google-fonts/montserrat/900Black';
import { Anton_400Regular } from '@expo-google-fonts/anton/400Regular';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue/400Regular';
import { Bangers_400Regular } from '@expo-google-fonts/bangers/400Regular';
import { Rubik_800ExtraBold } from '@expo-google-fonts/rubik/800ExtraBold';
import { PlayfairDisplay_700Bold_Italic } from '@expo-google-fonts/playfair-display/700Bold_Italic';
import { PermanentMarker_400Regular } from '@expo-google-fonts/permanent-marker/400Regular';
import { Unbounded_800ExtraBold } from '@expo-google-fonts/unbounded/800ExtraBold';
import { Outfit_700Bold } from '@expo-google-fonts/outfit/700Bold';
import { Outfit_800ExtraBold } from '@expo-google-fonts/outfit/800ExtraBold';
import { Oswald_700Bold } from '@expo-google-fonts/oswald/700Bold';
import type { FontFamily } from '../../shared/captions';

// Keys double as React Native fontFamily names.
const FONT_FILES = {
  Gilroy_500Medium: require('../../shared/fonts/gilroy/Gilroy-Medium.ttf'),
  Gilroy_600SemiBold: require('../../shared/fonts/gilroy/Gilroy-Semibold.ttf'),
  Inter_600SemiBold, Inter_800ExtraBold, Poppins_700Bold, Poppins_800ExtraBold,
  Montserrat_800ExtraBold, Montserrat_900Black, Anton_400Regular, BebasNeue_400Regular,
  Bangers_400Regular, Rubik_800ExtraBold, PlayfairDisplay_700Bold_Italic, PermanentMarker_400Regular,
  Unbounded_800ExtraBold, Outfit_700Bold, Outfit_800ExtraBold, Oswald_700Bold,
};

export const useCaptionFonts = () => useFonts(FONT_FILES);

const WEIGHT_NAMES: Record<number, string> = {
  400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black',
};

// Maps the shared (family, weight, italic) description to a loaded font file.
export function rnFont(family: FontFamily, weight: number, italic?: boolean) {
  const name = `${family}_${weight}${WEIGHT_NAMES[weight]}${italic ? '_Italic' : ''}`;
  return name in FONT_FILES ? name : `${family}_${weight}${WEIGHT_NAMES[weight]}`;
}
