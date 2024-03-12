---
sidebar_position: 1
---

# Introduce

## Background

As content creators, we often publish our articles on various third-party platforms. However, for those of us who are serious about our content, publishing is just the beginning. We need to continuously monitor our articles' readership over time. Unfortunately, our data collection capabilities are limited to what each platform offers, which heavily depends on the platform's own capabilities. Moreover, when we distribute the same content across different platforms, the readership and visitation data are completely isolated.

As a developer, I create many software applications. However, once I release these applications, I often lose control over them. For example, after releasing a command-line program, I have no way of knowing how users are interacting with it or even how many users are using my application. Similarly, when developing an open-source application, in the past, I could only gauge interest through GitHub stars, leaving me in the dark about actual usage.

Therefore, we need a simple solution that collects minimal information, respecting personal privacy and other restrictions. This solution is telemetry.

## Telemetry

In the field of computing, telemetry is a common technology that involves the minimal and anonymous reporting of information to accommodate privacy concerns while still meeting the basic analytical needs of content creators.

For example, React's Next.js framework collects information using telemetry: [API Reference: Next.js CLI | Next.js (nextjs.org)](https://nextjs.org/docs/app/api-reference/next-cli#telemetry)

Alternatively, by embedding a 1px-sized blank transparent pixel image in an article, it's possible to collect visitor data on websites over which we have no control. Modern browsers and most websites block the insertion of custom scripts due to potential security risks. However, an image appears much more harmless by comparison. Almost all websites allow the loading of third-party images, making telemetry feasible.

## What Information Can We Collect Through an Image?

Surprisingly, receiving a single image request allows us to collect more information than one might expect.

By analyzing network requests, we can obtain the user's IP address, visit time, referrer, and device type. This enables us to analyze traffic patterns, such as peak readership times and trends, demographic distribution, and traffic granularity across different platforms. This information is particularly valuable for marketing and promotional activities.

![](/img/telemetry/1.png)


## How Can We Implement Telemetry?

Telemetry is a straightforward technology that essentially requires an endpoint to receive internet requests. Due to its simplicity, there are few dedicated tools for this purpose. Many may not consider analytics important, or they might be deterred by the initial barriers. However, the demand for such functionality is clear.

Developing a telemetry solution is simple. You just need to create a project, set up a route, collect information from the request body, and return a blank image.

Here's an example using Node.js:

```jsx
router.get(
  '/telemetry.gif',
  async (req, res) => {
    const ip = req.ip;
    const referer = req.header['referer'];
    const userAgent = req.headers['user-agent'];
    
    // Store it in your database
    
    const blankGifBuffer = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.header('Content-Type', 'image/gif').send(blankGifBuffer);
  }
);
```

If you prefer not to develop your own solution, I recommend Tianji. As an open-source project offering **Website Analytics**, **Uptime Monitoring**, and **Server Status**, Tianji has recently introduced a telemetry feature to assist content creators in reporting telemetry, thereby facilitating better data collection. Most importantly, being open-source means you have control over your data and can aggregate traffic from multiple platforms in one place, avoiding the fragmentation of viewing the same information in different locations.

![](/img/telemetry/2.png)

GitHub: [https://github.com/msgbyte/tianji](https://github.com/msgbyte/tianji) 

Official Website: [https://tianji.msgbyte.com/](https://tianji.msgbyte.com/)
