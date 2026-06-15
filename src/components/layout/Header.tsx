// Legacy alias: the public site uses HeaderArabic everywhere.
// This wrapper guarantees that any page still importing `@/components/layout/Header`
// renders the same unified Arabic header, so older designs can never reappear.
import HeaderArabic from './HeaderArabic';

export default function Header() {
  return <HeaderArabic />;
}
