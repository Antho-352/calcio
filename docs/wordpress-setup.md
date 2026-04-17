# WordPress Headless Setup - vai-calcio.fr

Guide complet pour configurer WordPress headless sur wp.vai-calcio.fr.

## Installation WordPress

1. Installer WordPress sur wp.vai-calcio.fr (via cPanel, Softaculous, ou installation manuelle)
2. Configurer HTTPS avec certificat SSL Let's Encrypt
3. Créer un utilisateur admin

## Plugins Requis

### 1. WPGraphQL

**Installation** :
```
Plugins > Ajouter > Rechercher "WPGraphQL"
Installer et activer
```

**Configuration** :
- Aller dans GraphQL > Settings
- Vérifier que l'endpoint GraphQL est accessible : `https://wp.vai-calcio.fr/graphql`
- Tester avec GraphiQL : GraphQL > GraphiQL IDE

### 2. ACF (Advanced Custom Fields)

**Installation** :
```
Plugins > Ajouter > Rechercher "Advanced Custom Fields"
Installer et activer (version gratuite suffit)
```

**Configuration** :
Créer les custom taxonomies :

#### Taxonomie "Équipe"
1. Aller dans ACF > Taxonomies > Add New
2. Label : "Équipes"
3. Slug : `equipe`
4. Post Types : `post`
5. Hierarchical : Yes
6. Enregistrer

#### Taxonomie "Compétition"
1. Aller dans ACF > Taxonomies > Add New
2. Label : "Compétitions"
3. Slug : `competition`
4. Post Types : `post`
5. Hierarchical : Yes
6. Enregistrer

### 3. RankMath SEO

**Installation** :
```
Plugins > Ajouter > Rechercher "Rank Math SEO"
Installer et activer
```

**Configuration** :
1. Suivre l'assistant de configuration
2. Activer l'intégration OpenGraph
3. Activer les Schema.org types
4. Dans Rank Math > General Settings > Robots.txt :
   - **IMPORTANT** : Ajouter `Disallow: /` pour bloquer l'indexation du WordPress headless
5. Dans Rank Math > Titles & Meta > Posts :
   - Configurer les templates de title et meta description
6. Installer WPGraphQL Rank Math extension :
   ```
   Plugins > Ajouter > Uploader un plugin
   Télécharger : https://github.com/ashhitch/wp-graphql-yoast-seo
   (Alternative pour RankMath : https://github.com/AxeWP/wp-graphql-rank-math)
   ```

### 4. WP Webhooks

**Installation** :
```
Plugins > Ajouter > Rechercher "WP Webhooks"
Installer et activer (version gratuite suffit)
```

**Configuration du webhook de revalidation** :
1. Aller dans WP Webhooks > Send Data
2. Créer un nouveau webhook :
   - Trigger : `post_published`, `post_updated`
   - URL : `https://vai-calcio.fr/api/revalidate`
   - Method : POST
   - Headers :
     ```
     Authorization: Bearer VOTRE_REVALIDATE_SECRET
     Content-Type: application/json
     ```
   - Body :
     ```json
     {
       "postId": "{{post_id}}",
       "slug": "{{post_name}}",
       "action": "{{action}}"
     }
     ```
3. Tester le webhook

**Alternative sans plugin** : Ajouter dans `functions.php` :

```php
add_action('publish_post', 'revalidate_on_publish', 10, 2);
add_action('post_updated', 'revalidate_on_update', 10, 3);

function revalidate_on_publish($ID, $post) {
    send_revalidation_request($ID, $post, 'publish');
}

function revalidate_on_update($post_ID, $post_after, $post_before) {
    if ($post_after->post_status === 'publish') {
        send_revalidation_request($post_ID, $post_after, 'update');
    }
}

function send_revalidation_request($post_ID, $post, $action) {
    $url = 'https://vai-calcio.fr/api/revalidate';
    $secret = 'VOTRE_REVALIDATE_SECRET'; // À stocker dans wp-config.php

    $body = json_encode([
        'postId' => $post_ID,
        'slug' => $post->post_name,
        'action' => $action,
    ]);

    wp_remote_post($url, [
        'headers' => [
            'Authorization' => 'Bearer ' . $secret,
            'Content-Type' => 'application/json',
        ],
        'body' => $body,
        'timeout' => 10,
    ]);
}
```

## .htaccess Redirect (Duplicate Content Prevention)

**CRITIQUE** : Ajouter au début du `.htaccess` de WordPress (avant les règles WordPress standard) :

```apache
# BEGIN Custom Redirects
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /

# Rule 1: Homepage redirect (special case - is a directory)
RewriteCond %{HTTP_HOST} ^wp\.vai-calcio\.fr$ [NC]
RewriteCond %{REQUEST_URI} ^/$ [NC]
RewriteRule ^(.*)$ https://vai-calcio.fr/ [R=301,L]

# Rule 2: Articles/pages redirect (exclude physical files)
RewriteCond %{HTTP_HOST} ^wp\.vai-calcio\.fr$ [NC]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/wp-admin [NC]
RewriteCond %{REQUEST_URI} !^/wp-login\.php [NC]
RewriteCond %{REQUEST_URI} !^/wp-json [NC]
RewriteCond %{REQUEST_URI} !^/wp-includes [NC]
RewriteCond %{REQUEST_URI} !^/wp-content [NC]
RewriteRule ^(.*)$ https://vai-calcio.fr/$1 [R=301,L]
</IfModule>
# END Custom Redirects

# BEGIN WordPress
# ...règles WordPress standard...
# END WordPress
```

**Vérification** :
```bash
curl -I https://wp.vai-calcio.fr/
# Doit retourner : HTTP/1.1 301 Moved Permanently
# Location: https://vai-calcio.fr/

curl -I https://wp.vai-calcio.fr/wp-admin/
# Doit retourner : HTTP/1.1 200 OK (accessible)
```

## Meta Robots Noindex

Dans RankMath > General Settings > Edit Robots.txt :
- Ajouter globalement : `<meta name="robots" content="noindex, nofollow">`

Ou ajouter dans `functions.php` :

```php
add_action('wp_head', function() {
    if (!is_admin()) {
        echo '<meta name="robots" content="noindex, nofollow">';
    }
}, 1);
```

## Sécurité

### 1. Désactiver XML-RPC

Ajouter dans `functions.php` :

```php
add_filter('xmlrpc_enabled', '__return_false');
```

### 2. Restreindre wp-json

Ajouter dans `.htaccess` (après les règles de redirect) :

```apache
# Restrict wp-json to specific endpoints
<IfModule mod_rewrite.c>
RewriteRule ^wp-json/(?!wp/v2/|graphql/) - [R=403,L]
</IfModule>
```

### 3. Limiter les tentatives de connexion

Installer "Limit Login Attempts Reloaded" ou ajouter Cloudflare protection.

## Configuration Astro (.env)

```env
WORDPRESS_GRAPHQL_URL=https://wp.vai-calcio.fr/graphql
REVALIDATE_SECRET=GENERER_UN_TOKEN_SECURISE
```

## Tests de Validation

### 1. Test GraphQL

Aller sur : `https://wp.vai-calcio.fr/graphql`

Requête de test :
```graphql
query {
  posts(first: 5) {
    nodes {
      id
      title
      slug
    }
  }
}
```

### 2. Test Webhook

1. Publier un article de test
2. Vérifier les logs Astro (côté serveur Node) :
   ```
   Revalidation request: { postId: 123, slug: 'test-article', action: 'publish' }
   ```

### 3. Test Redirect

```bash
curl -I https://wp.vai-calcio.fr/test-article/
# Doit rediriger vers https://vai-calcio.fr/test-article/
```

## Maintenance

### Sauvegardes

- Base de données : backup quotidien via cPanel ou plugin (UpdraftPlus)
- Fichiers WordPress : backup hebdomadaire

### Mises à jour

- WordPress core : mettre à jour mensuellement
- Plugins : vérifier compatibilité GraphQL avant mise à jour
- Thème : ne pas installer de thème, WordPress headless n'en a pas besoin

## Dépannage

### GraphQL ne répond pas

1. Vérifier que WPGraphQL est activé
2. Vérifier les permaliens : Réglages > Permaliens > Enregistrer
3. Vider le cache WordPress

### Webhook ne fonctionne pas

1. Vérifier le secret token dans les headers
2. Tester manuellement avec curl :
   ```bash
   curl -X POST https://vai-calcio.fr/api/revalidate \
     -H "Authorization: Bearer VOTRE_SECRET" \
     -H "Content-Type: application/json" \
     -d '{"postId": "123", "slug": "test", "action": "publish"}'
   ```

### Redirect en boucle

1. Vérifier l'ordre des règles dans .htaccess (redirects AVANT WordPress)
2. Vérifier les conditions `!-f` et `!-d`
3. Vider le cache du navigateur

## Checklist Finale

- [ ] WPGraphQL installé et accessible
- [ ] ACF installé avec taxonomies Équipe et Compétition
- [ ] RankMath installé avec meta noindex
- [ ] Webhook configuré (WP Webhooks ou functions.php)
- [ ] .htaccess redirect configuré et testé
- [ ] robots.txt sur wp.vai-calcio.fr : `Disallow: /`
- [ ] GraphQL testé avec requête de posts
- [ ] Webhook testé avec publication article
- [ ] Redirect testé (wp.vai-calcio.fr → vai-calcio.fr)
- [ ] wp-admin accessible (pas redirigé)
- [ ] SSL activé (HTTPS)
