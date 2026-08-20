import PricingSection, { PackageItem } from './PricingSection';

interface Props {
    packages?: PackageItem[];
}

export default function PricingView({ packages = [] }: Props) {
    return (
        <div className="min-h-screen bg-white">
            <PricingSection packages={packages} />
        </div>
    );
}