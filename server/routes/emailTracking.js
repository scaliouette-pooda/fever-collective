const express = require('express');
const router = express.Router();
const { AutomatedEmailLog } = require('../models/AutomatedCampaign');

/**
 * Track email opens via 1x1 pixel
 * GET /api/email-tracking/open/:trackingId
 */
router.get('/open/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;

    const emailLog = await AutomatedEmailLog.findOne({ trackingId });

    if (emailLog) {
      const now = new Date();

      // Update open tracking
      if (!emailLog.opened) {
        emailLog.opened = true;
        emailLog.openedAt = now;
      }
      emailLog.openCount += 1;

      await emailLog.save();

      // Update campaign stats
      const campaign = await require('../models/AutomatedCampaign').AutomatedCampaign.findById(emailLog.campaign);
      if (campaign && !emailLog.opened) {
        campaign.stats.totalOpened = (campaign.stats.totalOpened || 0) + 1;
        await campaign.save();
      }
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private'
    });
    res.end(pixel);
  } catch (error) {
    console.error('Error tracking email open:', error);
    // Still return pixel even on error
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length
    });
    res.end(pixel);
  }
});

/**
 * Track email clicks via redirect
 * GET /api/email-tracking/click/:trackingId
 */
router.get('/click/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ message: 'Missing URL parameter' });
    }

    const emailLog = await AutomatedEmailLog.findOne({ trackingId });

    if (emailLog) {
      const now = new Date();

      // Update click tracking
      if (!emailLog.clicked) {
        emailLog.clicked = true;
        emailLog.clickedAt = now;
      }
      emailLog.clickCount += 1;

      // Track individual link clicks
      emailLog.clickedLinks.push({
        url: url,
        clickedAt: now
      });

      await emailLog.save();

      // Update campaign stats
      const campaign = await require('../models/AutomatedCampaign').AutomatedCampaign.findById(emailLog.campaign);
      if (campaign && !emailLog.clicked) {
        campaign.stats.totalClicked = (campaign.stats.totalClicked || 0) + 1;
        await campaign.save();
      }
    }

    // Redirect to actual URL
    res.redirect(url);
  } catch (error) {
    console.error('Error tracking email click:', error);
    // Redirect anyway if URL is provided
    if (req.query.url) {
      res.redirect(req.query.url);
    } else {
      res.status(500).json({ message: 'Error tracking click' });
    }
  }
});

/**
 * Get email tracking analytics for a campaign
 * GET /api/email-tracking/analytics/:campaignId
 */
router.get('/analytics/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;

    const emailLogs = await AutomatedEmailLog.find({
      campaign: campaignId,
      status: 'sent'
    });

    const analytics = {
      totalSent: emailLogs.length,
      totalOpened: emailLogs.filter(log => log.opened).length,
      totalClicked: emailLogs.filter(log => log.clicked).length,
      openRate: 0,
      clickRate: 0,
      clickToOpenRate: 0,
      recentOpens: [],
      recentClicks: [],
      topLinks: []
    };

    if (analytics.totalSent > 0) {
      analytics.openRate = ((analytics.totalOpened / analytics.totalSent) * 100).toFixed(2);
      analytics.clickRate = ((analytics.totalClicked / analytics.totalSent) * 100).toFixed(2);
    }

    if (analytics.totalOpened > 0) {
      analytics.clickToOpenRate = ((analytics.totalClicked / analytics.totalOpened) * 100).toFixed(2);
    }

    // Recent opens (last 10)
    analytics.recentOpens = emailLogs
      .filter(log => log.opened)
      .sort((a, b) => b.openedAt - a.openedAt)
      .slice(0, 10)
      .map(log => ({
        email: log.recipientEmail,
        openedAt: log.openedAt,
        openCount: log.openCount
      }));

    // Recent clicks (last 10)
    const allClicks = [];
    emailLogs.forEach(log => {
      log.clickedLinks.forEach(link => {
        allClicks.push({
          email: log.recipientEmail,
          url: link.url,
          clickedAt: link.clickedAt
        });
      });
    });
    analytics.recentClicks = allClicks
      .sort((a, b) => b.clickedAt - a.clickedAt)
      .slice(0, 10);

    // Top clicked links
    const linkCounts = {};
    allClicks.forEach(click => {
      linkCounts[click.url] = (linkCounts[click.url] || 0) + 1;
    });
    analytics.topLinks = Object.entries(linkCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([url, count]) => ({ url, clicks: count }));

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching email analytics:', error);
    res.status(500).json({ message: 'Failed to fetch email analytics' });
  }
});

module.exports = router;
