// Subscription database organized by category
const SUBSCRIPTION_DATABASE = {
  "AI Writing": {
    "ChatGPT": {
      "domains": ["openai.com", "chat.openai.com", "chatgpt.com", "www.chatgpt.com"],
      "features": ["AI writing", "Chat interface", "Code generation", "Creative writing"],
      "pricing": "Free tier + $20/month Pro"
    },
    "Copy.ai": {
      "domains": ["copy.ai"],
      "features": ["Marketing copy", "Blog posts", "Social media content", "Email campaigns"],
      "pricing": "From $35/month"
    },
    "Jasper": {
      "domains": ["jasper.ai"],
      "features": ["Long-form content", "Brand voice", "Templates", "Team collaboration"],
      "pricing": "From $39/month"
    },
    "Writesonic": {
      "domains": ["writesonic.com"],
      "features": ["AI writing", "SEO content", "Ads copy", "Product descriptions"],
      "pricing": "From $12.67/month"
    },
    "Claude": {
      "domains": ["anthropic.com", "claude.ai", "claude.com"],
      "features": ["AI assistant", "Writing help", "Analysis", "Code review"],
      "pricing": "Free tier + $20/month Pro"
    },
    "Grammarly": {
      "domains": ["grammarly.com"],
      "features": ["Grammar checking", "Writing suggestions", "Tone detection", "Plagiarism check"],
      "pricing": "Free tier + $12/month Premium"
    }
  },
  "Design": {
    "Figma": {
      "domains": ["figma.com"],
      "features": ["UI/UX design", "Collaboration", "Prototyping", "Design systems"],
      "pricing": "Free tier + $12/month Professional"
    },
    "Canva": {
      "domains": ["canva.com"],
      "features": ["Graphic design", "Templates", "Social media graphics", "Presentations"],
      "pricing": "Free tier + $12.99/month Pro"
    },
    "Adobe Creative Cloud": {
      "domains": ["adobe.com", "creative.adobe.com"],
      "features": ["Photoshop", "Illustrator", "InDesign", "Premiere Pro", "After Effects"],
      "pricing": "From $22.99/month"
    },
    "Sketch": {
      "domains": ["sketch.com"],
      "features": ["UI design", "Prototyping", "Collaboration", "Design handoff"],
      "pricing": "From $9/month"
    },
    "Framer": {
      "domains": ["framer.com"],
      "features": ["Website design", "Prototyping", "Animation", "Code generation"],
      "pricing": "Free tier + $20/month Pro"
    }
  },
  "Project Management": {
    "Notion": {
      "domains": ["notion.so", "notion.site"],
      "features": ["Notes", "Databases", "Project tracking", "Team collaboration"],
      "pricing": "Free tier + $8/month Personal Pro"
    },
    "Asana": {
      "domains": ["asana.com"],
      "features": ["Task management", "Project tracking", "Team collaboration", "Timeline view"],
      "pricing": "Free tier + $10.99/month Premium"
    },
    "Monday.com": {
      "domains": ["monday.com"],
      "features": ["Work management", "Project tracking", "Automation", "Team collaboration"],
      "pricing": "From $8/month"
    },
    "Trello": {
      "domains": ["trello.com"],
      "features": ["Kanban boards", "Task management", "Team collaboration", "Power-ups"],
      "pricing": "Free tier + $5/month Standard"
    },
    "ClickUp": {
      "domains": ["clickup.com"],
      "features": ["Task management", "Time tracking", "Docs", "Goals", "Whiteboards"],
      "pricing": "Free tier + $5/month Unlimited"
    },
    "Linear": {
      "domains": ["linear.app"],
      "features": ["Issue tracking", "Project management", "Team collaboration", "API"],
      "pricing": "Free tier + $8/month Standard"
    }
  },
  "Communication": {
    "Slack": {
      "domains": ["slack.com"],
      "features": ["Team chat", "Channels", "File sharing", "Integrations"],
      "pricing": "Free tier + $7.25/month Pro"
    },
    "Discord": {
      "domains": ["discord.com"],
      "features": ["Voice chat", "Text chat", "Screen sharing", "Community building"],
      "pricing": "Free tier + $9.99/month Nitro"
    },
    "Microsoft Teams": {
      "domains": ["teams.microsoft.com"],
      "features": ["Video conferencing", "Chat", "File sharing", "Office integration"],
      "pricing": "From $4/month"
    },
    "Zoom": {
      "domains": ["zoom.us"],
      "features": ["Video conferencing", "Screen sharing", "Recording", "Webinars"],
      "pricing": "Free tier + $14.99/month Pro"
    }
  },
  "Development": {
    "GitHub": {
      "domains": ["github.com"],
      "features": ["Code repository", "Issue tracking", "Pull requests", "CI/CD"],
      "pricing": "Free tier + $4/month Pro"
    },
    "GitLab": {
      "domains": ["gitlab.com"],
      "features": ["Code repository", "CI/CD", "Issue tracking", "DevOps"],
      "pricing": "Free tier + $19/month Premium"
    },
    "Bitbucket": {
      "domains": ["bitbucket.org"],
      "features": ["Code repository", "Pull requests", "CI/CD", "Jira integration"],
      "pricing": "Free tier + $3/month Standard"
    }
  },
  "Analytics": {
    "Google Analytics": {
      "domains": ["analytics.google.com"],
      "features": ["Website analytics", "User behavior", "Conversion tracking", "Reports"],
      "pricing": "Free tier + $150/month 360"
    },
    "Mixpanel": {
      "domains": ["mixpanel.com"],
      "features": ["Product analytics", "User tracking", "Funnel analysis", "Cohort analysis"],
      "pricing": "Free tier + $25/month Growth"
    },
    "Amplitude": {
      "domains": ["amplitude.com"],
      "features": ["Product analytics", "User behavior", "Retention analysis", "Experimentation"],
      "pricing": "Free tier + $61/month Starter"
    }
  },
  "Entertainment": {
    "Netflix": {
      "domains": ["netflix.com", "www.netflix.com"],
      "features": ["Movies", "TV shows", "Original content", "Multiple profiles"],
      "pricing": "From $6.99/month"
    },
    "Spotify": {
      "domains": ["spotify.com", "www.spotify.com"],
      "features": ["Music streaming", "Podcasts", "Offline listening", "Ad-free"],
      "pricing": "Free tier + $9.99/month Premium"
    },
    "Disney+": {
      "domains": ["disneyplus.com", "www.disneyplus.com"],
      "features": ["Disney movies", "Marvel", "Star Wars", "National Geographic"],
      "pricing": "From $7.99/month"
    },
    "Hulu": {
      "domains": ["hulu.com"],
      "features": ["TV shows", "Movies", "Live TV", "Original content"],
      "pricing": "From $6.99/month"
    },
    "Amazon Prime Video": {
      "domains": ["primevideo.com"],
      "features": ["Movies", "TV shows", "Prime originals", "Rental options"],
      "pricing": "Included with Prime ($14.99/month)"
    },
    "Apple TV+": {
      "domains": ["tv.apple.com"],
      "features": ["Original content", "Movies", "TV shows", "Family sharing"],
      "pricing": "From $4.99/month"
    },
    "YouTube Premium": {
      "domains": ["youtube.com"],
      "features": ["Ad-free videos", "Background play", "Downloads", "YouTube Music"],
      "pricing": "From $11.99/month"
    }
  },
  "Productivity": {
    "Microsoft 365": {
      "domains": ["office.com", "microsoft.com"],
      "features": ["Word", "Excel", "PowerPoint", "OneDrive", "Teams"],
      "pricing": "From $6.99/month"
    },
    "Google Workspace": {
      "domains": ["workspace.google.com"],
      "features": ["Gmail", "Drive", "Docs", "Sheets", "Meet"],
      "pricing": "From $6/month"
    },
    "Evernote": {
      "domains": ["evernote.com"],
      "features": ["Note taking", "Web clipping", "Search", "Sync"],
      "pricing": "Free tier + $7.99/month Premium"
    },
    "Todoist": {
      "domains": ["todoist.com"],
      "features": ["Task management", "Project organization", "Team collaboration", "Integrations"],
      "pricing": "Free tier + $4/month Pro"
    },
    "1Password": {
      "domains": ["1password.com"],
      "features": ["Password manager", "Secure sharing", "2FA", "Family plans"],
      "pricing": "From $2.99/month"
    },
    "LastPass": {
      "domains": ["lastpass.com"],
      "features": ["Password manager", "Secure sharing", "2FA", "Dark web monitoring"],
      "pricing": "Free tier + $3/month Premium"
    }
  }
};

// URL patterns that indicate subscription/pricing pages
const SUBSCRIPTION_URL_PATTERNS = [
  '/pricing',
  '/subscribe',
  '/signup',
  '/plans',
  '/billing',
  '/checkout',
  '/upgrade',
  '/pro/',
  '/premium',
  '/subscription',
  '/payment',
  '/buy',
  '/welcome',
  '/bundle',
  '/offer'
];

// Function to detect if current URL is a subscription page
function isSubscriptionPage(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const hash = urlObj.hash.toLowerCase();
    const search = urlObj.search.toLowerCase();
    
    // More precise pattern matching to avoid false positives
    const pathPatterns = [
      '/pricing',
      '/subscribe',
      '/signup', 
      '/plans',
      '/billing',
      '/checkout',
      '/upgrade',
      '/pro/',  // Only match /pro/ not /projects
      '/premium',
      '/subscription',
      '/payment',
      '/buy',
      '/welcome',
      '/bundle',
      '/offer'
    ];
    
    // Hash patterns (without leading slash)
    const hashPatterns = [
      'pricing',
      'subscribe',
      'signup',
      'plans',
      'billing',
      'checkout',
      'upgrade',
      'pro',
      'premium',
      'subscription',
      'payment',
      'buy',
      'welcome',
      'bundle',
      'offer'
    ];
    
    // Check pathname patterns with word boundaries
    const pathnameMatch = pathPatterns.some(pattern => {
      if (pattern === '/pro/') {
        // Special case: only match /pro/ exactly or /pro followed by end of string
        return pathname === '/pro' || pathname === '/pro/' || pathname.startsWith('/pro/');
      }
      return pathname.includes(pattern);
    });
    
    // Check hash patterns (like #pricing)
    const hashMatch = hashPatterns.some(pattern => 
      hash.includes(pattern.toLowerCase())
    );
    
    // Check search parameters (like ?tab=pricing)
    const searchMatch = pathPatterns.some(pattern => 
      search.includes(pattern.toLowerCase())
    );
    
    return pathnameMatch || hashMatch || searchMatch;
  } catch (error) {
    return false;
  }
}

// Function to get service category by domain
function getServiceByDomain(domain) {
  for (const [category, services] of Object.entries(SUBSCRIPTION_DATABASE)) {
    for (const [serviceName, serviceData] of Object.entries(services)) {
      if (serviceData.domains.includes(domain)) {
        return {
          category,
          serviceName,
          ...serviceData
        };
      }
    }
  }
  return null;
}

// Function to get all services in a category
function getServicesInCategory(category) {
  return SUBSCRIPTION_DATABASE[category] || {};
}

// Function to find potential overlaps
function findPotentialOverlaps(currentService, userSubscriptions) {
  const overlaps = [];
  
  if (!currentService || !userSubscriptions) return overlaps;
  
  // Check if user has other services in the same category
  const categoryServices = getServicesInCategory(currentService.category);
  const userServicesInCategory = userSubscriptions.filter(sub => 
    sub.category === currentService.category && sub.serviceName !== currentService.serviceName
  );
  
  userServicesInCategory.forEach(userService => {
    overlaps.push({
      existingService: userService.serviceName,
      newService: currentService.serviceName,
      category: currentService.category,
      existingUsage: userService.usageCount || 0,
      existingFeatures: categoryServices[userService.serviceName]?.features || [],
      newFeatures: currentService.features || []
    });
  });
  
  return overlaps;
}

// Make functions available globally
window.subscriptionDatabase = {
  SUBSCRIPTION_DATABASE,
  SUBSCRIPTION_URL_PATTERNS,
  isSubscriptionPage,
  getServiceByDomain,
  getServicesInCategory,
  findPotentialOverlaps
};
