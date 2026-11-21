import type { Questao } from '../../types';
import { PT } from './pt';
import { RLM } from './rlm';
import { ATU, ETI } from './atu-eti';
import { PROG } from './prog';
import { ES } from './es';
import { BD } from './bd';
import { GOV } from './gov';
import { SEG } from './seg';
import { WEB } from './web';
import { OUTROS } from './outros';

export const BANCO_BASE: Questao[] = [...PT, ...RLM, ...ATU, ...ETI, ...PROG, ...ES, ...BD, ...GOV, ...SEG, ...WEB, ...OUTROS];
