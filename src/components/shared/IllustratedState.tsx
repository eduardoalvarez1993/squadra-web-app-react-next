import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { buttonVariants } from '@/components/ui/button';

interface IllustratedStateAction {
  href: string;
  label: string;
  variant?: 'default' | 'outline';
}

interface IllustratedStateProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  imageAlt?: string;
  actions?: IllustratedStateAction[];
  children?: ReactNode;
}

export function IllustratedState({
  eyebrow,
  title,
  subtitle,
  description,
  image,
  imageAlt = '',
  actions = [],
  children,
}: IllustratedStateProps) {
  return (
    <main className="min-h-dvh bg-[#f7f8fc] px-5 py-8 flex items-center justify-center">
      <div className="grid w-full max-w-5xl grid-cols-1 items-center gap-8 md:grid-cols-[minmax(280px,1.02fr)_minmax(280px,.98fr)]">
        <section className="order-2 text-center md:order-1 md:text-left">
          {eyebrow && (
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.08em] text-purple-700">
              {eyebrow}
            </p>
          )}
          <h1 className="mb-3 text-4xl font-black leading-none text-blue-700 sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {subtitle && (
            <h2 className="mb-3 text-2xl font-extrabold leading-tight text-gray-950 sm:text-3xl">
              {subtitle}
            </h2>
          )}
          <p className="mx-auto max-w-lg text-base leading-relaxed text-gray-500 md:mx-0">
            {description}
          </p>

          {children}

          {actions.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={buttonVariants({ variant: action.variant ?? 'default', size: 'lg' })}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="order-1 flex justify-center md:order-2" aria-hidden={!imageAlt}>
          <Image
            src={image}
            alt={imageAlt}
            width={480}
            height={360}
            priority
            className="h-auto w-[min(88vw,480px)] drop-shadow-[0_24px_34px_rgba(29,78,216,0.13)]"
          />
        </section>
      </div>
    </main>
  );
}
