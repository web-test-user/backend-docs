document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. Theme Management (Dark / Light Mode)
    // ==========================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('theme-sun');
    const moonIcon = document.getElementById('theme-moon');
    
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    
    let currentTheme = 'dark';
    if (savedTheme) {
        currentTheme = savedTheme;
    } else if (systemPrefersLight) {
        currentTheme = 'light';
    }
    
    setTheme(currentTheme);
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }
    
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        if (theme === 'dark') {
            if (sunIcon) sunIcon.classList.remove('hidden');
            if (moonIcon) moonIcon.classList.add('hidden');
        } else {
            if (sunIcon) sunIcon.classList.add('hidden');
            if (moonIcon) moonIcon.classList.remove('hidden');
        }
    }

    // ==========================================
    // 2. Multi-Page Active Link Highlighter
    // ==========================================
    const path = window.location.pathname;
    let page = path.substring(path.lastIndexOf('/') + 1);
    
    // Handle root path or empty page name
    if (page === '' || page === 'index' || page === 'index.php') {
        page = 'index.html';
    }
    
    const menuLinks = document.querySelectorAll('.menu-link');
    menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
            // Check if href starts with the page name (to match hashes like backend.html#docker)
            const isCurrentPage = href === page || href.startsWith(page + '#') || (page === 'index.html' && href === 'index.html');
            if (isCurrentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        }
    });

    // ==========================================
    // 3. Mobile Sidebar Toggle
    // ==========================================
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    
    if (openSidebarBtn && sidebar) {
        openSidebarBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
    }
    
    if (closeSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }
    
    // Close sidebar on link click (for mobile experience)
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 992) {
                sidebar.classList.remove('open');
            }
        });
    });

    // ==========================================
    // 4. Copy to Clipboard Utility
    // ==========================================
    const copyButtons = document.querySelectorAll('.copy-btn');
    
    copyButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            // Get text to copy
            let textToCopy = '';
            
            // Scenario A: Button has a specific data-copy-text attribute
            if (btn.hasAttribute('data-copy-text')) {
                textToCopy = btn.getAttribute('data-copy-text');
            } 
            // Scenario B: Find sibling code element in code container
            else {
                const codeContainer = btn.closest('.code-container');
                if (codeContainer) {
                    const codeElement = codeContainer.querySelector('code');
                    if (codeElement) {
                        textToCopy = codeElement.textContent;
                    }
                }
            }
            
            if (!textToCopy) return;
            
            try {
                await navigator.clipboard.writeText(textToCopy);
                showCopiedState(btn);
            } catch (err) {
                console.error('Kopyalama hatası:', err);
                
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = textToCopy;
                textarea.style.position = 'fixed';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    showCopiedState(btn);
                } catch (fallbackErr) {
                    alert('Kopyalanamadı, lütfen manuel kopyalayın.');
                }
                document.body.removeChild(textarea);
            }
        });
    });
    
    function showCopiedState(button) {
        const originalContent = button.innerHTML;
        button.classList.add('copied');
        
        // Show check icon and "Kopyalandı" text
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px; height:14px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Kopyalandı!</span>
        `;
        
        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = originalContent;
        }, 2000);
    }

    // ==========================================
    // 5. Turkish-Friendly Live Search
    // ==========================================
    const searchInput = document.getElementById('search-input');
    const noResultsView = document.getElementById('no-results-view');
    const docSections = document.querySelectorAll('.doc-section');
    const subSections = document.querySelectorAll('.doc-subsection');
    const cards = document.querySelectorAll('.card, .placeholder-card');
    const topicCards = document.querySelectorAll('.topic-card'); // Dashboard cards
    
    // Turkish char normalizer helper
    function normalizeText(text) {
        if (!text) return '';
        return text
            .toString()
            .toLowerCase()
            .replace(/ı/g, 'i')
            .replace(/ş/g, 's')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/i̇/g, 'i') // fix for combined dot characters
            .trim();
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = normalizeText(e.target.value);
            
            if (query === '') {
                // Restore original state
                restoreSearchState();
                return;
            }
            
            let totalMatchCount = 0;
            
            // Dashboard page filtering
            if (page === 'index.html') {
                topicCards.forEach(card => {
                    const cardText = normalizeText(card.innerText);
                    if (cardText.includes(query)) {
                        card.classList.remove('hidden');
                        totalMatchCount++;
                    } else {
                        card.classList.add('hidden');
                    }
                });
            } 
            // Documentation pages filtering
            else {
                docSections.forEach(section => {
                    let sectionHasMatch = false;
                    
                    // Check subsections in this section
                    const sectionSubsections = section.querySelectorAll('.doc-subsection');
                    sectionSubsections.forEach(sub => {
                        let subHasMatch = false;
                        
                        // Check cards in this subsection
                        const subCards = sub.querySelectorAll('.card, .placeholder-card');
                        subCards.forEach(card => {
                            const cardText = normalizeText(card.innerText);
                            const isMatch = cardText.includes(query);
                            
                            if (isMatch) {
                                card.classList.remove('hidden');
                                subHasMatch = true;
                                sectionHasMatch = true;
                                totalMatchCount++;
                            } else {
                                card.classList.add('hidden');
                            }
                        });
                        
                        // If subsection title itself matches, show everything in it
                        const subTitleText = normalizeText(sub.querySelector('.subsection-title')?.innerText);
                        if (subTitleText.includes(query)) {
                            subCards.forEach(card => card.classList.remove('hidden'));
                            subHasMatch = true;
                            sectionHasMatch = true;
                            totalMatchCount++;
                        }
                        
                        if (subHasMatch) {
                            sub.classList.remove('hidden');
                        } else {
                            sub.classList.add('hidden');
                        }
                    });
                    
                    // If section title itself matches, show everything in it
                    const sectionTitleText = normalizeText(section.querySelector('.section-title')?.innerText);
                    if (sectionTitleText.includes(query)) {
                        sectionHasMatch = true;
                        section.querySelectorAll('.doc-subsection, .card, .placeholder-card').forEach(el => el.classList.remove('hidden'));
                        totalMatchCount++;
                    }
                    
                    if (sectionHasMatch) {
                        section.classList.remove('hidden');
                    } else {
                        section.classList.add('hidden');
                    }
                });
            }
            
            // Toggle no results view
            if (noResultsView) {
                if (totalMatchCount === 0) {
                    noResultsView.classList.remove('hidden');
                } else {
                    noResultsView.classList.add('hidden');
                }
            }
        });
    }
    
    function restoreSearchState() {
        if (noResultsView) noResultsView.classList.add('hidden');
        topicCards.forEach(card => card.classList.remove('hidden'));
        docSections.forEach(section => section.classList.remove('hidden'));
        subSections.forEach(sub => sub.classList.remove('hidden'));
        cards.forEach(card => card.classList.remove('hidden'));
    }

    // ==========================================
    // 6. ScrollSpy & Sidebar Highlight Sync
    // ==========================================
    const scrollSections = document.querySelectorAll('.doc-subsection');
    
    if (scrollSections.length > 0) {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    
                    menuLinks.forEach(item => {
                        const href = item.getAttribute('href');
                        // Check if link matches both current page and section hash
                        if (href && href === `${page}#${id}`) {
                            menuLinks.forEach(l => l.classList.remove('active'));
                            item.classList.add('active');
                            
                            const sidebarMenu = document.querySelector('.sidebar-menu');
                            if (sidebarMenu) {
                                const itemTop = item.offsetTop;
                                const menuHeight = sidebarMenu.clientHeight;
                                if (itemTop > menuHeight) {
                                    sidebarMenu.scrollTop = itemTop - 100;
                                }
                            }
                        }
                    });
                }
            });
        }, observerOptions);
        
        scrollSections.forEach(section => observer.observe(section));
    }

});
