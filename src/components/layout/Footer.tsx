// Legacy alias: the public site uses FooterArabic everywhere.
// This wrapper guarantees that any page still importing `@/components/layout/Footer`
// renders the same unified Arabic footer.
import FooterArabic from './FooterArabic';

export default function Footer() {
  return <FooterArabic />;
}
