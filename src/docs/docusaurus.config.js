module.exports = {
  title: 'NBomber',
  tagline: 'NBomber',
  url: 'https://nbomber.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/nbomber-logo.ico',
  organizationName: 'Pragmatic Flow',
  projectName: 'NBomber',
  themeConfig: {
    //disableDarkMode: false,  
    disableSwitch: true,
    defaultMode: 'dark',
    respectPrefersColorScheme: true,  
    gtag: {
      trackingID: 'UA-139868155-1'
    },
    navbar: {
      title: '',
      logo: {
        alt: 'NBomber',
        src: 'img/nbomber-logo.svg',
        href: 'https://nbomber.com',
        target: '_self'
      },
      items: [
        {
          to: 'docs/overview',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'left',
        },
        {
          to: 'docs/changelog',  
          activeBasePath: 'changelog',
          label: 'Changelog',
          position: 'left'
        }, 
        {
          href: 'https://github.com/PragmaticFlow/NBomber/tree/dev/examples',
          label: 'Examples',
          position: 'left'
        },        
        // {to: 'blog', label: 'Blog', position: 'left'},
        // {
        //   href: 'https://github.com/facebook/docusaurus',
        //   label: 'GitHub',
        //   position: 'right',
        // },
      ],
    },
    footer: {
      style: 'dark',
      // links: [
      //   {
      //     title: 'Docs',
      //     items: [
      //       {
      //         label: 'Style Guide',
      //         to: 'docs/',
      //       },
      //       {
      //         label: 'Second Doc',
      //         to: 'docs/doc2/',
      //       },
      //     ],
      //   },
      //   {
      //     title: 'Community',
      //     items: [
      //       {
      //         label: 'Stack Overflow',
      //         href: 'https://stackoverflow.com/questions/tagged/docusaurus',
      //       },
      //       {
      //         label: 'Discord',
      //         href: 'https://discordapp.com/invite/docusaurus',
      //       },
      //       {
      //         label: 'Twitter',
      //         href: 'https://twitter.com/docusaurus',
      //       },
      //     ],
      //   },
      //   {
      //     title: 'More',
      //     items: [
      //       {
      //         label: 'Blog',
      //         to: 'blog',
      //       },
      //       {
      //         label: 'GitHub',
      //         href: 'https://github.com/facebook/docusaurus',
      //       },
      //     ],
      //   },
      // ],
      copyright: `Copyright © ${new Date().getFullYear()} Pragmatic Flow`,
    },
    prism: {
      theme: require('prism-react-renderer/themes/dracula'),
      additionalLanguages: ['csharp', 'fsharp'],
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {          
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          //editUrl: 'https://github.com/facebook/docusaurus/edit/master/website/',          
        },        
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // editUrl: 'https://github.com/facebook/docusaurus/edit/master/website/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
