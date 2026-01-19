/**
 * Job Search Filters Configuration
 * Single-user focused filtering for high-quality PE/DevOps roles
 */

module.exports = {
    // Scraping mode
    scrapingMode: process.env.SCRAPING_MODE || 'past_day', // 'past_day' or 'past_week'

    // Target roles (primary keywords)
    targetRoles: [
        'Platform Engineer',
        'Platform Engineering',
        'Cloud Engineer',
        'Cloud Infrastructure Engineer',
        'DevOps Engineer',
        'SRE',
        'Site Reliability Engineer',
        'Infrastructure Engineer',
        'DevOps Platform Engineer'
    ],

    // Experience level filters
    experienceLevel: {
        min: 1,    // Minimum years (to cast wider net)
        max: 4,    // Maximum years (PE2 range)
        idealRange: [2, 3]  // Ideal range for scoring
    },

    // Salary filtering (high-paid jobs focus)
    salaryFilter: {
        enabled: true,
        minAnnualINR: 1200000,   // 12 LPA minimum (₹12L)
        minAnnualUSD: 70000,      // $70k minimum for remote/US jobs
        preferredMinINR: 1800000  // 18 LPA preferred (₹18L)
    },

    // Location preferences
    locations: {
        india: ['Bangalore', 'Bengaluru', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi', 'NCR', 'Gurgaon', 'Noida'],
        remote: ['Remote', 'Work from Home', 'WFH', 'Remote-India', 'Anywhere'],
        international: [] // Empty = focus on India + remote
    },

    // Required keywords (job MUST have at least one from each group)
    requiredKeywords: {
        technical: [
            'kubernetes', 'k8s', 'docker', 'containers',
            'aws', 'azure', 'gcp', 'cloud',
            'terraform', 'infrastructure as code', 'iac',
            'ci/cd', 'jenkins', 'gitlab', 'github actions',
            'monitoring', 'prometheus', 'grafana'
        ],
        level: [
            'mid-level', 'mid level', 'pe2', 'pe-2', 'l4', 'ic2', 'ic3',
            '2-4 years', '2-3 years', '1-4 years',
            'junior-to-mid', 'associate'
        ]
    },

    // Exclude keywords (skip job if ANY of these appear)
    excludeKeywords: [
        // Seniority filters
        'senior', 'staff', 'principal', 'lead', 'architect', 'head of',
        'director', 'vp', 'chief', 'manager', 'engineering manager',
        '5+ years', '6+ years', '7+ years', '10+ years',
        'l5', 'l6', 'ic4', 'ic5',

        // Wrong domains
        'data engineer', 'data scientist', 'ml engineer', 'ai engineer',
        'frontend', 'front-end', 'react', 'angular', 'vue',
        'mobile', 'ios', 'android', 'flutter',
        'qa', 'test', 'manual testing',

        // Internships/contract
        'intern', 'internship', 'trainee', 'fresher',
        'contract', 'freelance', 'part-time', 'consultant',

        // Geographic exclusions (if focusing on India)
        // Add specific countries/cities you want to exclude
    ],

    // Preferred keywords (boost score if present)
    preferredKeywords: [
        'startup', 'well-funded', 'series a', 'series b', 'series c',
        'fast-growing', 'high-growth',
        'equity', 'esop', 'stock options',
        'flexible hours', 'remote-first',
        'platform team', 'infrastructure team', 'sre team',
        'microservices', 'kubernetes', 'service mesh', 'istio',
        'observability', 'distributed systems'
    ],

    // Company size preferences
    companySize: {
        preferred: ['startup', 'scaleup', 'mid-size'],
        exclude: [] // e.g., ['enterprise', 'large-corp'] if you want to avoid
    },

    // Job type
    jobType: {
        required: ['full-time', 'permanent'],
        exclude: ['contract', 'internship', 'part-time']
    },

    // Scoring weights (used by AI)
    scoringWeights: {
        titleMatch: 0.3,        // How well job title matches target roles
        keywordDensity: 0.25,   // Technical keyword presence
        salaryMatch: 0.15,      // Salary meets threshold
        companyQuality: 0.15,   // Startup/growth indicators
        experienceMatch: 0.15   // Experience level fit
    },

    // Time-based scraping configuration
    timeFilters: {
        past_day: {
            hours: 24,
            description: 'Jobs posted in last 24 hours',
            recommendedSchedule: '0 */6 * * *'  // Every 6 hours
        },
        past_week: {
            hours: 168,  // 7 days
            description: 'Jobs posted in last 7 days',
            recommendedSchedule: '0 0 * * *'  // Once daily
        }
    },

    // Platform-specific filters
    platformOverrides: {
        linkedin: {
            experienceLevel: '2',  // LinkedIn's experience level code
            jobType: 'F',  // Full-time
            location: 'India',
            salary: { min: 1200000, currency: 'INR' }
        },
        naukri: {
            experience: '1-4',
            salary: { min: 12, max: 40, unit: 'Lacs' },
            location: 'Bangalore/Bengaluru, Hyderabad, Pune'
        },
        indeed: {
            experience: 'mid_level',
            salary: { min: 1200000, currency: 'INR' },
            datePosted: 'last'  // last 24 hours
        }
    }
};
