import { Head } from '@inertiajs/react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import HeroSection from '@/components/marketing/HeroSection';
import ProductShowcase from '@/components/marketing/ProductShowcase';
import SystemConnectionSection from '@/components/marketing/SystemConnectionSection';
import RoleExperienceSection from '@/components/marketing/RoleExperienceSection';
import FeatureShowcase from '@/components/marketing/FeatureShowcase';
import SecurityTrustSection from '@/components/marketing/SecurityTrustSection';
import PricingSection from '@/components/marketing/PricingSection';
import FAQSection from '@/components/marketing/FAQSection';
import AnnouncementModal from '@/components/marketing/AnnouncementModal';
import FeaturesView from '@/components/marketing/FeaturesView';
import PricingView from '@/components/marketing/PricingView';
import AboutView from '@/components/marketing/AboutView';
import ContactView from '@/components/marketing/ContactView';
import LegalView from '@/components/marketing/LegalView';
import {
    HomeQuickHighlights,
    HomeEfficiencyMatrix,
    HomeTermLifecycle,
    HomeCurriculumTypes,
    HomeOperationalControl,
    HomeOutcomesMetrics,
    HomeGuidedOnboarding,
    HomeResourcesGuides,
    HomeActionBanner,
} from '@/components/marketing/HomeSections';

interface Package {
    id: number;
    name: string;
    description: string | null;
    price_monthly: string;
    price_yearly: string;
    trial_days: number;
    features: string[] | null;
}

interface NavItem {
    id?: number;
    label: string;
    url: string;
    badge?: string;
}

interface Branding {
    name?: string;
    logo_url?: string | null;
    support_phone?: string | null;
    support_email?: string | null;
    footer_copyright?: string | null;
}

interface Section {
    identifier?: string;
    block_type: string;
    content: Record<string, any> | null;
}

interface CmsPage {
    title: string;
    seo_title: string | null;
    seo_description: string | null;
    canonical_url: string | null;
    og_image_path: string | null;
    robots_index: boolean;
    robots_follow: boolean;
    structured_data: Record<string, unknown> | null;
    sections: Section[];
}

interface FaqItem {
    id: number;
    question: string;
    answer: string;
    category?: string | null;
    slug?: string;
}

interface Props {
    page: CmsPage | null;
    packages?: Package[];
    homepageFaqs?: FaqItem[];
    navigation?: NavItem[];
    footerNavigation?: NavItem[];
    branding?: Branding;
    requestedPath?: string;
}

const LEGAL_SLUGS = ['privacy', 'cookies', 'terms', 'saas-terms', 'security', 'governance', 'disclaimer'];

export default function WebsitePage({
    page,
    packages = [],
    homepageFaqs = [],
    navigation,
    footerNavigation,
    branding,
    requestedPath = '/'
}: Props) {
    const rawPath = (typeof requestedPath === 'string' ? requestedPath : '').replace(/^\/+|\/+$/g, '') || 'home';

    const aliasMap: Record<string, string> = {
        'privacy-policy': 'privacy',
        'terms-of-service': 'terms',
        'cookie-policy': 'cookies',
        'saas-agreement': 'saas-terms',
        'security-controls': 'security',
        'legal-disclaimer': 'disclaimer',
    };

    const path = aliasMap[rawPath] || rawPath;
    const isLegal = LEGAL_SLUGS.includes(path);

    const getSection = (key: string) => 
        page?.sections?.find((item) => item.identifier === key)?.content || 
        page?.sections?.find((item) => item.block_type === key)?.content || 
        {};

    const hero = getSection('hero');
    const faq = getSection('faq') || getSection('questions');
    const homepageFaqItems = homepageFaqs.length > 0 ? homepageFaqs : (faq.items || []);
    const title = page?.seo_title || page?.title || (branding?.name ? `${branding.name} - Modern School Management & CBC Platform` : 'EduFlow');

    return (
        <MarketingLayout
            title={title}
            description={page?.seo_description || undefined}
            navigation={navigation}
            footerNavigation={footerNavigation}
            branding={branding as any}
            currentPath={requestedPath}
        >
            <Head title={title}>
                {page?.canonical_url && <link rel="canonical" href={page.canonical_url} />}
                {page?.og_image_path && <meta property="og:image" content={page.og_image_path} />}
                {page && <meta name="robots" content={`${page.robots_index ? 'index' : 'noindex'},${page.robots_follow ? 'follow' : 'nofollow'}`} />}
                {page?.structured_data && <script type="application/ld+json">{JSON.stringify(page.structured_data)}</script>}
            </Head>

            {path === 'features' && <FeaturesView />}
            {path === 'pricing' && <PricingView packages={packages} />}
            {path === 'about' && <AboutView branding={branding as any} page={page} sections={page?.sections as any} />}
            {path === 'contact' && <ContactView branding={branding as any} />}
            {isLegal && <LegalView type={path as any} branding={branding as any} page={page} sections={page?.sections as any} />}
            {path === 'faq' && <FAQSection faqs={homepageFaqItems} title={faq.heading} subtitle={faq.body} showViewAll={false} />}

            {path === 'home' && (
                <>
                    {/* 1. Primary Hero */}
                    <HeroSection body={hero.body} />

                    {/* 2. Quick 5-Pill Highlights */}
                    <HomeQuickHighlights content={getSection('home-quick-highlights')} />

                    {/* 3. Product Preview Showcase */}
                    <ProductShowcase />

                    {/* 4. Connected Operations Flow */}
                    <SystemConnectionSection />

                    {/* 5. Efficiency Matrix (Digital vs Manual) */}
                    <HomeEfficiencyMatrix content={getSection('home-efficiency-matrix')} />

                    {/* 6. Multi-Curriculum & Campus Banner */}
                    <HomeCurriculumTypes content={getSection('home-curriculum-types')} />

                    {/* 7. Comprehensive Capabilities Grid */}
                    <FeatureShowcase />

                    {/* 8. Stakeholder Roles Breakdown */}
                    <RoleExperienceSection />

                    {/* 9. Continuous Term Lifecycle (8 Steps) */}
                    <HomeTermLifecycle content={getSection('home-term-lifecycle')} />

                    {/* 10. Operational Control Tools Grid */}
                    <HomeOperationalControl content={getSection('home-operational-control')} />

                    {/* 11. Outcomes & Performance Metrics */}
                    <HomeOutcomesMetrics content={getSection('home-outcomes-metrics')} />

                    {/* 12. 5-Step Guided Onboarding */}
                    <HomeGuidedOnboarding content={getSection('home-guided-onboarding')} />

                    {/* 13. Institutional Trust & Security */}
                    <SecurityTrustSection />

                    {/* 14. Transparent School Packages */}
                    <PricingSection packages={packages} />

                    {/* 15. Resources & Scaling Guides */}
                    <HomeResourcesGuides content={getSection('home-resources-guides')} />

                    {/* 16. Frequently Asked Questions */}
                    <FAQSection faqs={homepageFaqItems} title={faq.heading} subtitle={faq.body} />

                    {/* 17. High-Conversion Emerald Action Banner (PLACED AFTER FAQS) */}
                    <HomeActionBanner content={getSection('home-action-banner')} />

                    {/* 18. Announcement Modal */}
                    <AnnouncementModal />
                </>
            )}
        </MarketingLayout>
    );
}