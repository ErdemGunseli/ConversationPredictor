"use client";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconLayoutSidebar,
  IconX,
  IconLogout,
  IconUserBolt,
  IconMessagePlus,
  IconDownload,
  IconTrash,
} from "@tabler/icons-react";
import { useUser } from "@/context/UserContext";
import { useConversation } from "@/context/ConversationContext";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
} from "@tabler/icons-react";
import { IconChecklist } from "@tabler/icons-react";
import { usePWAInstall } from "@/context/PWAInstallContext";
import { ConversationRecorder } from "./conversation-recorder";
import { LanguageSelector } from "./language-selector";
import { Spotlight } from "./spotlight-new";
import { useGlassesMode } from "@/context/GlassesModeContext";
import { Switch } from "./switch";
import { Glasses } from "lucide-react";
import { Logo } from "./Logo";
import { ModeToggle } from "./mode-toggle";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/** A simple interface for links. */
interface Links {
  label: string;
  icon: React.JSX.Element | React.ReactNode;
  onClick?: () => void;
  isLanguageSelector?: boolean;
  isCustomComponent?: boolean;
}

export function SidebarWithHover() {
    return (
        <SidebarLayout>
            <Dashboard />
        </SidebarLayout>
    );
}


export function SidebarLayout({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
    const { logout } = useUser();
    const { deferredPrompt, isInstalled, setDeferredPrompt, setIsInstalled } = usePWAInstall();
    const { glassesMode, toggleGlassesMode } = useGlassesMode();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleInstall = () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === "accepted") {
                console.log("User accepted to install PWA");
            }
            setDeferredPrompt(null);
            setIsInstalled(true);
        });
    };

    // Helper to detect if the device is iOS.
    const isIos =
        typeof window !== "undefined" &&
        /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

    // Custom installation handler for iOS.
    const handleIosInstall = () => {
        // You can replace this with a modal or other UI as needed.
        alert("To install this app, tap the Share icon and then 'Add to Home Screen'.");
    };

    // Determine if the install button should be shown.
    const shouldShowInstall = !isInstalled && (deferredPrompt || isIos);

    // Updated bottomLinks to position glasses mode at the bottom
    const bottomLinks: Links[] = [
        {
            label: "Language Selector",
            icon: <LanguageSelector compact={true} inSidebar={true} />,
            isLanguageSelector: true,
        },
        ...(shouldShowInstall
            ? [
                {
                    label: "Install Convers",
                    icon: (
                        <IconDownload className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
                    ),
                    onClick: isIos ? handleIosInstall : handleInstall,
                },
            ]
            : []),
        {
            label: "Log out",
            icon: (
                <IconLogout className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
            ),
            onClick: () => logout(),
        },
        {
            label: "Glasses Mode",
            icon: (
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                        <Glasses className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200 mr-2" />
                        <span className="text-sm text-neutral-700 dark:text-neutral-200">Glasses Mode</span>
                    </div>
                    <Switch
                        checked={glassesMode}
                        onCheckedChange={toggleGlassesMode}
                    />
                </div>
            ),
            isCustomComponent: true,
        },
    ];

    return (
        <div
            className={cn(
                "flex w-full flex-1 flex-col overflow-hidden bg-gray-100 dark:bg-neutral-800 md:flex-row h-screen",
                className
            )}
        >
            {/* Sidebar content */}
            <Sidebar>
                <SidebarBody className="justify-between gap-4" open={sidebarOpen} setOpen={setSidebarOpen}>
                    {/* DESKTOP Top row: Logo + ModeToggle */}
                    <div className="hidden md:flex flex-row items-center justify-between p-3">
                        <Logo size="text-lg" />
                        <ModeToggle />
                    </div>

                    {/* Main (scrollable) content */}
                    <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                        {/* Conversations section - pass setSidebarOpen */}
                        <ConversationsList setSidebarOpen={setSidebarOpen} />
                    </div>

                    {/* Bottom Section */}
                    <MobileBottomLinks bottomLinks={bottomLinks} />

                    <div className="hidden md:flex flex-col gap-2 p-3">
                        {bottomLinks.map((link, idx) => (
                            <SidebarLink key={idx} link={link} id={`desktop-bottom-link-${idx}`} />
                        ))}
                    </div>
                </SidebarBody>
            </Sidebar>

            {/* Children content to the right */}
            {children}
        </div>
    );
}

// Conversations list component
function ConversationsList({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) {
  const { 
    conversations, 
    loadConversations, 
    createConversation, 
    deleteConversation,
    updateConversation, 
    currentConversation, 
    setCurrentConversation 
  } = useConversation();
  const { user } = useUser();
  const [conversationToDelete, setConversationToDelete] = useState<number | null>(null);
  const [editingConversationId, setEditingConversationId] = useState<number | null>(null);
  const [editedName, setEditedName] = useState<string>("");

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const handleNewConversation = async () => {
    await createConversation();
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yy');
    } catch (e) {
      return dateString;
    }
  };

  const confirmDelete = async () => {
    if (conversationToDelete !== null) {
      await deleteConversation(conversationToDelete);
      setConversationToDelete(null);
    }
  };

  // Start editing a conversation name
  const handleDoubleClick = (conversation: any) => {
    setEditingConversationId(conversation.id);
    setEditedName(conversation.name);
  };

  // Save the edited name
  const handleSaveName = async (conversationId: number) => {
    if (editedName.trim()) {
      await updateConversation(conversationId, { name: editedName.trim() });
      
      // If this was the current conversation, update it in state
      if (currentConversation?.id === conversationId) {
        setCurrentConversation({
          ...currentConversation,
          name: editedName.trim()
        });
      }
    }
    setEditingConversationId(null);
  };

  // Handle keyboard events in the edit input
  const handleKeyDown = (e: React.KeyboardEvent, conversationId: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveName(conversationId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingConversationId(null);
    }
  };

  // Get the conversation name for the dialog title
  const getConversationName = () => {
    if (conversationToDelete === null) return '';
    const conversation = conversations.find((c: { id: number; name: string }) => c.id === conversationToDelete);
    return conversation ? conversation.name : '';
  };

  const handleSelectConversation = (conversation: any) => {
    setCurrentConversation(conversation);
    // Close the sidebar on mobile when a conversation is selected
    setSidebarOpen(false);
  };

  return (
    <div className="mt-4 flex flex-col">
      <div className="flex items-center px-4 py-2">
        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          Conversations
        </span>
        <button
          onClick={handleNewConversation}
          className="ml-auto rounded-full p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors duration-200"
          aria-label="Create new conversation"
        >
          <IconMessagePlus className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
        </button>
      </div>
      <div className="h-px w-full bg-neutral-200 dark:bg-neutral-700" />
      
      {/* Conversation list with improved hover styling */}
      <div className="mt-2 space-y-1 px-2">
        {conversations.length === 0 ? (
          <div className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
            No conversations yet
          </div>
        ) : (
          conversations.map((conversation: { id: number; name: string; updated_at: string }) => (
            <div 
              key={conversation.id} 
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm cursor-pointer transition-all duration-200 ${
                currentConversation?.id === conversation.id 
                  ? 'bg-neutral-200 dark:bg-neutral-700 shadow-sm' 
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/70'
              }`}
              onClick={() => handleSelectConversation(conversation)}
            >
              <div className="flex-1 truncate">
                {editingConversationId === conversation.id ? (
                  // Editing mode - show input field
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, conversation.id)}
                    onBlur={() => handleSaveName(conversation.id)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-1 py-0.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  // Display mode - show name with double-click handler
                  <div 
                    className="font-medium text-neutral-800 dark:text-neutral-200 truncate"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleDoubleClick(conversation);
                    }}
                  >
                    {conversation.name}
                  </div>
                )}
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatDate(conversation.updated_at)}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConversationToDelete(conversation.id);
                }}
                className="ml-2 rounded-full p-1 text-neutral-500 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors duration-200"
                aria-label="Delete conversation"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
      
      {/* Updated Dialog Implementation with proper mobile margins */}
      <Dialog open={conversationToDelete !== null} onOpenChange={(open) => !open && setConversationToDelete(null)}>
        <DialogContent className="z-[200] max-w-[calc(100%-2rem)] mx-auto w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete &apos;{getConversationName()}&apos;</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button 
              variant="simple" 
              onClick={() => setConversationToDelete(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white border-none"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** A dummy placeholder for demonstration. */
function Dashboard() {
  const { currentConversation } = useConversation();
  
  return (
    <div className="relative flex-1 overflow-hidden flex flex-col">
      
      <div className="flex flex-col flex-1 w-full h-full rounded-t-2xl md:rounded-tl-2xl md:rounded-tr-none md:rounded-bl-none md:rounded-br-none border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900 relative z-10 overflow-hidden">
        <div className="flex-1 w-full h-full relative">
          {/* Place Spotlight with a lower z-index so it doesn't override borders */}
          <div className="absolute inset-0 z-0 overflow-hidden rounded-t-2xl md:rounded-tl-2xl md:rounded-tr-none md:rounded-bl-none md:rounded-br-none">
            <Spotlight />
          </div>
          
          {/* Content container with higher z-index */}
          <div className="relative z-10 w-full h-full overflow-auto">
            <ConversationRecorder conversation={currentConversation} />
          </div>
        </div>
      </div>
    </div>
  );
}


function MobileBottomLinks({ bottomLinks }: { bottomLinks: Links[] }) {
  return (
    <div className="flex md:hidden flex-col gap-2 p-3 h-auto">
      {bottomLinks.map((link, idx) => (
        <SidebarLink key={idx} link={link} id={`mobile-bottom-link-${idx}`} />
      ))}
    </div>
  );
}

export const Sidebar = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const SidebarBody = ({
  children,
  open,
  setOpen,
  className,
  ...props
}: {
  children: React.ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
  className?: string;
  [key: string]: any;
}) => {
  return (
    <>
      <DesktopSidebar className={className} {...props}>{children}</DesktopSidebar>
      <MobileSidebar 
        open={open} 
        setOpen={setOpen} 
        className={className}
      >
        {children}
      </MobileSidebar>
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  return (
    <motion.div
      className={cn(
        "hidden h-full w-[300px] flex-shrink-0 bg-neutral-100 px-4 py-4 dark:bg-neutral-800 md:flex md:flex-col",
        className
      )}
      animate={{
        width: "300px",
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};


export const MobileSidebar = ({
  className,
  children,
  open,
  setOpen,
}: {
  className?: string;
  children: React.ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  return (
    <>
      {/* Show this top bar only if the menu is NOT open */}
      {!open && (
        <div
          className={cn(
            "flex h-10 w-full flex-row items-center justify-start gap-2 bg-neutral-100 px-4 py-6 dark:bg-neutral-800 md:hidden"
          )}
        >
          <IconLayoutSidebar
            className="text-neutral-800 dark:text-neutral-200"
            onClick={() => setOpen(true)}
          />
          <Logo size="text-lg" />
          {/* ModeToggle has been removed here so it won't appear when mobile menu is closed */}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className={cn(
              "fixed inset-0 z-[100] flex h-full w-full flex-col justify-start bg-white p-4 dark:bg-neutral-900 sm:p-10",
              className
            )}
          >
            {/* Top bar in menu-open state: Logo + ModeToggle on the left, close icon on the right */}
            <div className="mb-4 flex w-full flex-row items-center justify-between py-3">
              <div className="flex flex-row items-center gap-2">
                <Logo size="text-lg" />
                {/* ModeToggle is shown here when the sidebar is open */}
                <ModeToggle />
              </div>
              <IconX
                className="text-neutral-800 dark:text-neutral-200"
                onClick={() => setOpen(false)}
              />
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/** Individual link item. */
export const SidebarLink = ({
  link,
  className,
  id,
  ...props
}: {
  link: Links;
  className?: string;
  id?: string;
}) => {
  const [hovered, setHovered] = useState<string | null>(null);

  // If this is the language selector or a custom component, render it directly
  if (link.isLanguageSelector || link.isCustomComponent) {
    return (
      <div className="px-4 py-2 w-full">
        {link.icon}
      </div>
    );
  }

  return (
    <button
      onClick={link.onClick}
      className={cn("group/sidebar relative w-full text-left px-4 py-1", className)}
      onMouseEnter={() => {
        setHovered(id ?? null);
      }}
      onMouseLeave={() => {
        setHovered(null);
      }}
      {...props}
    >
      {hovered === id && (
        <motion.div
          layoutId="hovered-sidebar-link"
          className="absolute inset-0 z-10 rounded-xl bg-neutral-200 dark:bg-neutral-900"
        />
      )}
      <div className="relative z-20 flex items-center justify-start gap-2 py-2">
        {link.icon}
        <motion.span
          animate={{
            display: "inline-block",
            opacity: 1,
          }}
          className="!m-0 inline-block whitespace-pre !p-0 text-sm text-neutral-700 transition duration-150 group-hover/sidebar:translate-x-1 dark:text-neutral-200"
        >
          {link.label}
        </motion.span>
      </div>
    </button>
  );
};
