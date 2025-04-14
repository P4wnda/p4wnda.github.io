---
layout: null
---

document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  
  if (!searchInput || !searchResults) return;

  const posts = [
    {% for post in site.posts %}
    {
      title: "{{ post.title | escape }}",
      url: "{{ site.baseurl }}{{ post.url }}",
      date: "{{ post.date | date: '%B %-d, %Y' }}"
    }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ];

  function performSearch(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    return posts.filter(post => 
      post.title.toLowerCase().includes(searchTerm)
    );
  }

  function displayResults(results) {
    if (results.length === 0) {
      searchResults.innerHTML = '<p class="no-results">No results found</p>';
      return;
    }

    const html = results.map(post => `
      <div class="search-result">
        <h3><a href="${post.url}">${post.title}</a></h3>
        <small>${post.date}</small>
      </div>
    `).join('');

    searchResults.innerHTML = html;
  }

  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();
    
    // Clear the previous timeout
    clearTimeout(searchTimeout);
    
    if (searchTerm.length > 0) {
      // Add a small delay to prevent searching on every keystroke
      searchTimeout = setTimeout(() => {
        const results = performSearch(searchTerm);
        displayResults(results);
        searchResults.style.display = 'block';
      }, 300);
    } else {
      searchResults.style.display = 'none';
    }
  });
}); 