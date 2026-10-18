import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StudyDialog } from "@/components/study/study-dialog";
import { VideoDialog } from "@/components/home/video-button";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <StudyDialog />
      <VideoDialog />
    </div>
  );
}
