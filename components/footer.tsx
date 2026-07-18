"use client"
import { siteMetadata } from "@/app/sitemetadata"
import { GithubIcon, LinkedinIcon, TwitterIcon } from "./icons"

const Footer = () =>{
    return(
        <footer className="bg-background border-t flex flex-col items-center">
            <div className="mx-auto py-10">
                <p className="text-center text-xs text-primary">
                    &copy; 2024 SocialWatch, Inc. All rights reserved musingila
                </p>

            </div>
            <div className="hidden sm:flex items-center ">
                <a href={siteMetadata.linkedin} className="w-6 h-2 mr-4 inline-block"><LinkedinIcon className='hover:scale-110 transition-all ease duration-200'/></a>
                <a href={siteMetadata.twitter} className="w-6 h-2 mr-4 inline-block"><TwitterIcon className='hover:scale-110 transition-all ease duration-200'/></a>
                <a href={siteMetadata.github} className="w-6 h-2 mr-4 inline-block dark:fill-light"><GithubIcon className='hover:scale-110 transition-all ease duration-200'/></a>
               
            </div>

        </footer>
    )
}

export default Footer