import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
 
const webfingerJSON = {
  subject: "acct:toasterson@chaos.social",
  aliases: [
    "https://chaos.social/@Toasterson",
    "https://chaos.social/users/Toasterson"
  ],
  links: [
    {
      "rel": "http://webfinger.net/rel/profile-page",
      "type": "text/html",
      "href": "https://chaos.social/@Toasterson"
    },
    {
      "rel": "self",
      "type": "application/activity+json",
      "href": "https://chaos.social/users/Toasterson"
    },
    {
      "rel": "http://ostatus.org/schema/1.0/subscribe",
      "template": "https://chaos.social/authorize_interaction?uri={uri}"
    }
  ]
}


export const GET = (({ url }) => {
  return json(webfingerJSON);
}) satisfies RequestHandler;
