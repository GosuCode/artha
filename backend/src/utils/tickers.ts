export const COMPANIES = [
    { name: 'Nabil Bank', ticker: 'NABIL', sector: 'Banking' },
    { name: 'NIC Asia Bank', ticker: 'NICA', sector: 'Banking' },
    { name: 'Global IME Bank', ticker: 'GBIME', sector: 'Banking' },
    { name: 'Standard Chartered Bank', ticker: 'SCB', sector: 'Banking' },
    { name: 'Himalayan Bank', ticker: 'HBL', sector: 'Banking' },
    { name: 'Nepal Investment Mega Bank', ticker: 'NIMB', sector: 'Banking' },
    { name: 'Everest Bank', ticker: 'EBL', sector: 'Banking' },
    { name: 'Prabhu Bank', ticker: 'PRVU', sector: 'Banking' },
    { name: 'Sanima Bank', ticker: 'SANIMA', sector: 'Banking' },
    { name: 'Nepal SBI Bank', ticker: 'SBI', sector: 'Banking' },
    { name: 'Machhapuchhre Bank', ticker: 'MBL', sector: 'Banking' },
    { name: 'Kumari Bank', ticker: 'KBL', sector: 'Banking' },
    { name: 'Laxmi Sunrise Bank', ticker: 'LSL', sector: 'Banking' },
    { name: 'Citizens Bank International', ticker: 'CZBIL', sector: 'Banking' },
    { name: 'Prime Commercial Bank', ticker: 'PCBL', sector: 'Banking' },
    { name: 'Nepal Bank', ticker: 'NBL', sector: 'Banking' },
    { name: 'Agricultural Development Bank', ticker: 'ADBL', sector: 'Banking' },
    { name: 'Rastriya Banijya Bank', ticker: 'RBB', sector: 'Banking' },

    { name: 'Muktinath Bikas Bank', ticker: 'MNBBL', sector: 'Development Bank' },
    { name: 'Garima Bikas Bank', ticker: 'GBBL', sector: 'Development Bank' },
    { name: 'Jyoti Bikas Bank', ticker: 'JBBL', sector: 'Development Bank' },
    { name: 'Lumbini Bikas Bank', ticker: 'LBBL', sector: 'Development Bank' },
    { name: 'Shangrila Development Bank', ticker: 'SADBL', sector: 'Development Bank' },
    { name: 'Shine Resunga Development Bank', ticker: 'SHINE', sector: 'Development Bank' },
    { name: 'Kamana Sewa Bikas Bank', ticker: 'KSBBL', sector: 'Development Bank' },

    { name: 'ICFC Finance', ticker: 'ICFC', sector: 'Finance' },
    { name: 'Manjushree Finance', ticker: 'MFIL', sector: 'Finance' },
    { name: 'Goodwill Finance', ticker: 'GFCL', sector: 'Finance' },
    { name: 'Pokhara Finance', ticker: 'PFL', sector: 'Finance' },
    { name: 'Central Finance', ticker: 'CFCL', sector: 'Finance' },

    { name: 'Chilime Hydropower', ticker: 'CHCL', sector: 'Hydropower' },
    { name: 'Upper Tamakoshi Hydropower', ticker: 'UPPER', sector: 'Hydropower' },
    { name: 'Butwal Power Company', ticker: 'BPCL', sector: 'Hydropower' },
    { name: 'Sanjen Jalavidhyut', ticker: 'SANJEN', sector: 'Hydropower' },
    { name: 'Rasuwagadhi Hydropower', ticker: 'RHPL', sector: 'Hydropower' },
    { name: 'Arun Valley Hydropower', ticker: 'AHPC', sector: 'Hydropower' },
    { name: 'Api Power Company', ticker: 'API', sector: 'Hydropower' },

    { name: 'Nepal Telecom', ticker: 'NTC', sector: 'Others' },
    { name: 'Nepal Reinsurance Company', ticker: 'NRIC', sector: 'Others' },
    { name: 'Citizen Investment Trust', ticker: 'CIT', sector: 'Others' },
    { name: 'Hydroelectricity Investment and Development Company', ticker: 'HIDCL', sector: 'Investment' },

    { name: 'Shivm Cements', ticker: 'SHIVM', sector: 'Manufacturing & Processing' },
    { name: 'Ghorahi Cement Ghorahi', ticker: 'GCIL', sector: 'Manufacturing & Processing' },
    { name: 'Sonapur Minerals and Oil', ticker: 'SONA', sector: 'Manufacturing & Processing' },
    { name: 'Himalayan Distillery', ticker: 'HDL', sector: 'Manufacturing & Processing' },
    { name: 'Unilever Nepal', ticker: 'UNL', sector: 'Manufacturing & Processing' },
    { name: 'Bottlers Nepal (Terai)', ticker: 'BNT', sector: 'Manufacturing & Processing' },
];

export const TICKER_MAP = new Map(COMPANIES.map(c => [c.ticker, c]));
export const NAME_MAP = new Map(COMPANIES.map(c => [c.name.toLowerCase(), c]));

export function findCompanyByTicker(ticker: string) {
    return TICKER_MAP.get(ticker.toUpperCase());
}

export function findCompanyByText(text: string) {
    const lowerText = text.toLowerCase();
    for (const [name, company] of NAME_MAP.entries()) {
        if (lowerText.includes(name)) return company;
    }
    return null;
}
