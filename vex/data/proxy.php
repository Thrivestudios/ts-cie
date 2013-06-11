<?php
  /**
   * Fetches the contents of the given URL and performs caching.
   * 
   * If the maximum cache age is zero, the URL contents are not cached
   * and this script acts like a normal proxy.  Otherwise, the cached
   * file is only returned if it meets the maximum age requirement.  If
   * this requirement is not met, the contents are loaded from the URL
   * and a new cache file is created.
   * 
   * @param url The URL to fetch via proxy or cache.
   * @param max_cache_age The maximum age for a cached copy of the URL contents.  Default is zero.
   * @param cache_only Indicates whether URL contents should ever be fetched.  Default is false.
   */
  
  $url = isset($_GET['url']) ? $_GET['url'] : FALSE;
  $maxCacheAge = isset($_GET['max_cache_age']) ? $_GET['max_cache_age'] : 0;
  if (!is_numeric($maxCacheAge) || $maxCacheAge < 0) $maxCacheAge = 0;
  $cacheOnly = isset($_GET['cache_only']) ? (bool) $_GET['cache_only'] : FALSE;
  $contentType = isset($_GET['content_type']) ? $_GET['content_type'] : FALSE;
  $callback = isset($_GET['callback']) ? $_GET['callback'] : FALSE;
  
  if ($url !== FALSE)
  {
    $expiry = date('D, d M Y H:i:s T', time() + $maxCacheAge);
    header("Expires: $expiry");

    if ($contentType) {
      header("Content-type: $contentType");
    }
    
    if ($maxCacheAge != 0)
    {
      $cacheFilePath = "proxy_cache/" . md5($url);
      if (file_exists($cacheFilePath))
      {
        $cacheTime = filemtime($cacheFilePath);
        if (time() - $maxCacheAge < $cacheTime)
        {
          if ($callback) print "$callback(";
          include($cacheFilePath);
          if ($callback) print ");";
          exit;
        }
      }
    }
      
    if ($cacheOnly)
    {
      header("HTTP/1.0 404 Not Found");
      exit;
    }
    
    if ($callback) print "$callback(";

    ob_start();
   
    if (!@readfile($url))
    {
      // should check for status code from the URL and return that.
      header("HTTP/1.0 404 Not Found");
      exit;
    }

    if ($maxCacheAge > 0)
    {
      $fp = fopen($cacheFilePath, 'w');
      fwrite($fp, ob_get_contents());
      fclose($fp);
    }
  
    ob_end_flush();

    if ($callback) print ");";
  }
