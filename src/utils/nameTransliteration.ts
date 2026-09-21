import { AppLanguage } from '../types';

const COMMON_NAMES_MAP: Record<string, { te: string; hi: string }> = {
  rohini: { te: 'రోహిణి', hi: 'रोहिणी' },
  ramesh: { te: 'రమేష్', hi: 'रमेश' },
  sita: { te: 'సీత', hi: 'सीता' },
  suresh: { te: 'సురేష్', hi: 'सुरेश' },
  ananya: { te: 'అనన్య', hi: 'अनन्या' },
  rajesh: { te: 'రాజేష్', hi: 'राजेश' },
  priya: { te: 'ప్రియ', hi: 'प्रिया' },
  vikram: { te: 'విక్రమ్', hi: 'विक्रम' },
  sunitha: { te: 'సునీత', hi: 'सुनीता' },
  gowthami: { te: 'గౌతమి', hi: 'गौतमी' },
  arjun: { te: 'అర్జున్', hi: 'अर्जुन' },
};

export function getLocalizedUserName(name: string, language: AppLanguage): string {
  if (!name) return language === 'te-IN' ? 'మిత్రమా' : language === 'hi-IN' ? 'मित्र' : 'Friend';

  const lower = name.trim().toLowerCase();
  const matched = COMMON_NAMES_MAP[lower];

  if (language === 'te-IN' && matched?.te) {
    return matched.te;
  }
  if (language === 'hi-IN' && matched?.hi) {
    return matched.hi;
  }

  return name;
}
