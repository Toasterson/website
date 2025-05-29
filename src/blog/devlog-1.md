---
title: "Devlog #1"
type: post
date: 2022-06-05
summary: First devlog
layout: post.njk
---

# Devlog #1

## Preamble
Welcome to my first devlog. In the Tech sector Public speaking has always been a big part of how we share knowledge and
communicate. I personally have talked to people and held some talks but I never really got started with blogging. 
Although there are multiple attempts, all of them ended with me not liking the format or not wanting to spend the time
needed for it to have a good purpose. Recently I got more into Indie game development and the practices in that community.
One of which is, that the Game you make in your free time is the fun you have making it. So it's less about the final product 
and more about the process. The same is true for my OpenSource work. I worked many times on projects for a long time
just to realize I do not like the Language (C++) or that in the end it will be better to make another project.
And everytime I do that without writing about the process I bury the knowledge about the things I learnt in the code. 
That is not useful for me nor others. I decided to just write some things I find important about the work of the week.
So without further ado here is my first Devlog. Leave me some comments on my Social media or via mail. Hope you like it.

## OpenIndiana
### Cloney
Starting with a bit of the boring but necessary. This week I made a change to Cloney, the OpenIndiana script helper to copy the downloaded package sources to the build
directory. To do that it uses symlinks but several packages like golang 1.18 are using file detection to check the type
of file during build. Assembler embedding is the one function that got added in 1.18 specifically. So the build fails,
because the symlinks are not followed. The simple fix was to switch to hardlinks but now some other tools require symlinks....
So I will be introduce `CLONEY_MODE` variable this week, so we can easily switch the build between symlink, hardlinks and 
recursive copy. For now we have Golang 1.18 packaged an available. It is now the default when installing the golang 
meta-package.

### (Automated) Installer for x86
In more interesting news I have started work on the installer part of the system install and configuration utilities.
All the utilities and supporting libraries can be found on [GitHub](https://github.com/Toasterson/illumos-installer)
Design wise I made a couple of decisions that can be useful later. All main plumbing and instruction handling is 
built as libraries. We can use those to either easily build tools to configure and install systems or other use cases 
we can come up with. In any case it is a comprehensive gathering of configuration and setup tasks. I don't know yet how 
most people will want to use the automated installer but that is decidable at a later stage. For now the usecase i think
will be most useful one, is that people can freely define a step by step instruction file. This file together with
the templates of files to be rendered or copied in place make up an installation bundle. One can then use git or a webserver to
store that install bundle and the tar archive of the image to be installed. I later want to support imgapi from smartos
as storage aswell which is why I started with the `libimgapi` crate in the installer workspace. At the moment it can only 
parse the manifests returned by https://images.smartos.org but that will be enough for the start. 
I do at the moment liberaly clone code from @jclulows image builder. Mostly because the steps he used to build the image
also fit the installer use-case. Installed imaged are after all also only images in the illumos ips world. 

## Aurora OpenCloud
A friend of mine has shared recently the garage S3 Server with me. And based on that together with some services like 
nextcloud and [vyos](https://docs.vyos.io/en/equuleus/) I think I have the start of a capable cloud backplane and some
initial services people like. ownClouds ocis is also nice to have as it allows providers to provide within their ecosystem.

As this cloud software will be heavily based on the cli I had a basic idea on how that should be seperated.
The workflow I am aming for is `configure -> commit -> deploy` with that one can easily manage configuration versions
but also use the ClockOps workflows. As it's simply a commit without needing a review. I want to wrap that into 3 CLI's
- cloudcfg (or cldcfg) which will handle the writing of configurations and applying them to the cloud. The config files will
live in the cloud and modified by a GRPC API. I don't know yet how I want to handle the storage. But most things will have Postgres
as database backend for the Configuration that is currently active. I want something simple though. Nothing that computes
state or does more things than the operator explicitly says.
- cloudadm (or cldadm) will be responsible to administer and maintain resources. Say reboot a service that you are managing
inside a tenant or switching of a machine.
- cloudsh (or cldsh) will be the main shell to read data from the cloud and process it. I want to make it based on 
[nushell](https://www.nushell.sh/). This will allows admins to do fancy data analysis on their management VM's or local
computers without needing to fall back to text parsing. Monitored alerts and data can be printed to the data channel by
plugins and the builtin commands and filters from nushell do the heavy filter lifting making development easier and giving
the most flexibility one can get from any tool that outputs data.

## Indiedev
In personal news, as I am getting rid of all my Maker tools, I limited myself to two Hobbies. Working on illumos and 
Indie game development. I will be doing this with two friends. So today we sat down for a Virtual Coffee and Brainstormed
what we would like to do. 

We ended up with the following synthesized list:
- Sci-fi Ancient Greece / Gothic styles (to starts)
- Vermintidelike mass enemy action
- Buildup of Cities and Trade
- Different worlds accessible via Portals
- Snappy Battle system
- Fancy sound with a wild mix of Genres (My friends want to play with their synthezisers and Instruments and see what they can make)
- Modding support

More on this will come in the next weeks when we see how this ideas develop. For now it gives me a very elegant excuse to
have a look into [Godot 4's Multiplayer support](https://godotengine.org/article/multiplayer-changes-godot-4-0-report-1).

Hope you liked this devlog and leave me note on the Socials what you like to read up more in details.

So long
-Toasty