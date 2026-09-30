# Turn on Cloud save (about 10 minutes, once)

Cloud save lets Hanifa's phone, her laptop and your laptop share the same progress. It also copies her app journal into
the working sheet and brings your sheet replies back into the app. It runs as a small Google Apps Script in **your**
Google account (syedxanshah@gmail.com) and costs nothing.

## 1. Create the script

1. Go to <https://script.google.com> and press **New project**. Create it here, not from the working sheet's
   Extensions menu: the sheet is link-shared, and anyone with that link could open a script attached to it.
2. Name it `My Future World cloud` (click "Untitled project" at the top).
3. Delete everything in `Code.gs`, paste in the whole of [`apps-script/Code.js`](../apps-script/Code.js), and press
   **Save** (💾).

## 2. Set the Mentor PIN

1. Click **Project Settings** (⚙️ on the left) and scroll to **Script Properties**.
2. Press **Add script property**. Property: `MENTOR_PIN`, Value: your PIN. Press **Save script properties**.

Only you can see this, and the PIN is no longer anywhere in the app.

## 3. Run setup once

1. Back in the **Editor** (`< >` on the left), choose `setup` in the function menu at the top and press **Run**.
2. Google asks for permission. Choose your account, then **Advanced → Go to My Future World cloud (unsafe)** → **Allow**.
   ("Unsafe" only means Google hasn't reviewed your own script.) It needs your spreadsheets, to store the app data and
   write the App Journal tab.
3. The log should say **All set** and show a link to a new private spreadsheet, *My Future World: app data (private)*.
   That's where the app's data now lives. Don't edit it by hand.

## 4. Deploy it as a web app

1. Press **Deploy → New deployment**. Click ⚙️ next to "Select type" and choose **Web app**.
2. Description: `v1`. **Execute as: Me**. **Who has access: Anyone** (the app has no Google sign-in, so it must be
   reachable without one).
3. Press **Deploy** and copy the **Web app URL** (it ends in `/exec`).

## 5. Connect the devices

1. In the app on your laptop: sign in as Mentor → **Mentor Hub → Sync & devices** → paste the URL → **Connect this device**.
2. Copy the **link for Hanifa's devices** and send it to her. She opens it once on her phone and once on her laptop.
   Anything already on a device is merged in, so nothing is lost.

A cloud icon in the top bar shows the status: green means saved, amber means offline or a problem (her work stays on the
device and is sent later).

To connect every device automatically instead, set `NEXT_PUBLIC_CLOUD_URL` to the web app URL where the site is hosted
(for example in Vercel's Environment Variables) and redeploy the site.

## Updating the script later

After changing `Code.js`, paste it in again, then **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**.
The URL stays the same.

## Good to know

- **Sign every Mentor device out:** delete the `TOKEN_SECRET` script property.
- **Change the PIN:** edit `MENTOR_PIN`.
- **Keep the web app URL private.** Anyone who has it can read the synced data. It's only in the device link you send
  Hanifa.
- **Tighter sheet sharing (optional):** the working sheet is currently "Anyone with the link: Editor". Syncing only
  needs "Viewer". Switching to Viewer and adding Hanifa as an editor by email stops strangers who get the link from
  changing it.
- **Replying from the sheet:** in the **App Journal** tab, type in the yellow "Sikander's reply" column. Hanifa sees it in
  the app within a minute or two. Don't edit the other columns: the tab is rewritten from the app whenever she saves an
  entry (your replies are kept).
