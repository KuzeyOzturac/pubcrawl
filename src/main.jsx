import React from 'react';
import './app.js';
import {createRoot} from 'react-dom/client';
import {Theme} from '@astryxdesign/core/theme';
import {Heading} from '@astryxdesign/core/Heading';
import {Button} from '@astryxdesign/core/Button';
import {themes, defaultThemeSlug} from '../astryx-themes';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';

function Hero(){
  return <Theme theme={themes[defaultThemeSlug]}><section className="hero"><div><div className="eyebrow">A field guide to a good night out</div><Heading level={1} type="display-1">A better way<br/><em>between pubs.</em></Heading><p>Find the local favourites around you, then follow a walk that connects them. Your next round starts with a place.</p><div className="hero-actions"><Button label="Plan a crawl" variant="primary" onClick={() => document.getElementById('location').focus()}/><span>No account. Just a route.</span></div></div><div className="hero-aside"><span className="asterisk" aria-hidden="true">✳</span><p><strong>Made for wandering.</strong><br/>Set a starting point, tune your radius, and edit your stops as you go. Pub details come from OpenStreetMap.</p></div></section></Theme>;
}
createRoot(document.getElementById('hero-root')).render(<Hero/>);
