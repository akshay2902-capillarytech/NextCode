import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import VideoPlayer from "@/components/video-player";
import { AuthContext } from "@/context/auth-context";
import { StudentContext } from "@/context/student-context";
import {
     checkCoursePurchaseInfoService,
     createPaymentService,
     fetchStudentViewCourseDetailsService,
} from "@/services";
import { CheckCircle, Globe, Languages, LanguagesIcon, Lock, PlayCircle } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

function StudentViewCourseDetailsPage() {
     const {
          studentViewCourseDetails,
          setStudentViewCourseDetails,
          currentCourseDetailsId,
          setCurrentCourseDetailsId,
          loadingState,
          setLoadingState,
     } = useContext(StudentContext);

     const { auth } = useContext(AuthContext);

     const [displayCurrentVideoFreePreview, setDisplayCurrentVideoFreePreview] =
          useState(null);
     const [showFreePreviewDialog, setShowFreePreviewDialog] = useState(false);
     const [approvalUrl, setApprovalUrl] = useState("");
     const navigate = useNavigate();
     const { id } = useParams();
     const location = useLocation();

     async function fetchStudentViewCourseDetails() {
          const checkCoursePurchaseInfoResponse =
               await checkCoursePurchaseInfoService(
                    currentCourseDetailsId,
                    auth?.user._id
               );

          if (
               checkCoursePurchaseInfoResponse?.success &&
               checkCoursePurchaseInfoResponse?.data
          ) {
               navigate(`/course-progress/${currentCourseDetailsId}`);
               return;
          }

          const response = await fetchStudentViewCourseDetailsService(
               currentCourseDetailsId,
          );

          if (response?.success) {
               setStudentViewCourseDetails(response?.data);
               setLoadingState(false);
          } else {
               setStudentViewCourseDetails(null);
               setLoadingState(false);
          }
     }

     function handleSetFreePreview(getCurrentVideoInfo) {
          // console.log(getCurrentVideoInfo);
          setDisplayCurrentVideoFreePreview(getCurrentVideoInfo?.videoUrl);
     }

     async function handleCreatePayment() {
          toast('Payment processing');
          const paymentPayload = {
               userId: auth?.user?._id,
               userName: auth?.user?.userName,
               userEmail: auth?.user?.userEmail,
               orderStatus: "pending",
               paymentMethod: "paypal",
               paymentStatus: "initiated",
               orderDate: new Date(),
               paymentId: "",
               payerId: "",
               instructorId: studentViewCourseDetails?.instructorId,
               instructorName: studentViewCourseDetails?.instructorName,
               courseImage: studentViewCourseDetails?.image,
               courseTitle: studentViewCourseDetails?.title,
               courseId: studentViewCourseDetails?._id,
               coursePricing: studentViewCourseDetails?.pricing,
          };

          // console.log(paymentPayload, "paymentPayload");
          const response = await createPaymentService(paymentPayload);

          if (response.success) {
               sessionStorage.setItem(
                    "currentOrderId",
                    JSON.stringify(response?.data?.orderId)
               );
               setApprovalUrl(response?.data?.approveUrl);

          }
     }

     useEffect(() => {
          if (displayCurrentVideoFreePreview !== null) setShowFreePreviewDialog(true);
     }, [displayCurrentVideoFreePreview]);

     useEffect(() => {
          if (currentCourseDetailsId !== null) fetchStudentViewCourseDetails();
     }, [currentCourseDetailsId]);

     useEffect(() => {
          if (id) setCurrentCourseDetailsId(id);
     }, [id]);

     useEffect(() => {
          if (!location.pathname.includes("course/details"))
               setStudentViewCourseDetails(null),
                    setCurrentCourseDetailsId(null),
                    setCoursePurchaseId(null)
     }, [location.pathname]);

     if (loadingState) return <Skeleton />;

     if (approvalUrl !== "") {
          window.location.href = approvalUrl;
     }

     const getIndexOfFreePreviewUrl =
          studentViewCourseDetails !== null
               ? studentViewCourseDetails?.curriculum?.findIndex(
                    (item) => item.freePreview
               )
               : -1;

     return (
          <div className=" mx-auto p-4">
               <div className="bg-blue-900 text-white p-8 rounded-t-lg">
                    <h1 className="text-3xl font-bold mb-4">
                         {studentViewCourseDetails?.title}
                    </h1>
                    <p className="text-xl mb-4">{studentViewCourseDetails?.subtitle}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                         <span>Created by : {studentViewCourseDetails?.instructorName.substr(0,1).toUpperCase()}{studentViewCourseDetails?.instructorName.substr(1)}</span>
                         <span>Last modified : {studentViewCourseDetails?.date.split("T")[0]}</span>

                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                         <span className="flex items-center">
                              Language :{' '}
                              {studentViewCourseDetails?.primaryLanguage.substr(0,1).toUpperCase()}{studentViewCourseDetails?.primaryLanguage.substr(1)}
                         </span>
                         <span>
                              Students Enrolled :{' '}
                              {studentViewCourseDetails?.students.length}
                         </span>
                    </div>
               </div>
               <div className="flex flex-col md:flex-row gap-8 mt-8">
                    <main className="flex-grow">
                         <Card className="mb-8">
                              <CardHeader>
                                   <CardTitle>What you'll learn</CardTitle>
                              </CardHeader>
                              <CardContent>
                                   <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {studentViewCourseDetails?.objectives
                                             .split(",")
                                             .map((objective, index) => (
                                                  objective.trim().length > 0 ?
                                                  <li key={index} className="flex items-start">
                                                       <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
                                                       <span className="mt-0">{objective}</span>
                                                  </li> : null
                                             ))}
                                   </ul>
                              </CardContent>
                         </Card>
                         <Card className="mb-8">
                              <CardHeader>
                                   <CardTitle>Course Description</CardTitle>
                              </CardHeader>
                              <CardContent>{studentViewCourseDetails?.description}</CardContent>
                         </Card>
                         <Card className="mb-8">
                              <CardHeader>
                                   <CardTitle>Course Curriculum</CardTitle>
                              </CardHeader>
                              <CardContent>
                                   {studentViewCourseDetails?.curriculum?.map(
                                        (curriculumItem, index) => (
                                             <li
                                                  className={`${curriculumItem?.freePreview
                                                       ? "cursor-pointer"
                                                       : "cursor-not-allowed"
                                                       } flex items-center mb-4`}
                                                  onClick={
                                                       curriculumItem?.freePreview
                                                            ? () => handleSetFreePreview(curriculumItem)
                                                            : null
                                                  }
                                             >
                                                  {curriculumItem?.freePreview ? (
                                                       <PlayCircle className="mr-2 h-4 w-4" />
                                                  ) : (
                                                       <Lock className="mr-2 h-4 w-4" />
                                                  )}
                                                  <span>{curriculumItem?.title}</span>
                                             </li>
                                        )
                                   )}
                              </CardContent>
                         </Card>
                    </main>
                    <aside className="w-full md:w-[500px]">
                         <Card className="sticky top-4">
                              <CardContent className="p-6">
                                   <div className="aspect-video rounded-lg flex items-center justify-center">
                                        <VideoPlayer
                                             url={
                                                  getIndexOfFreePreviewUrl !== -1
                                                       ? studentViewCourseDetails?.curriculum[
                                                            getIndexOfFreePreviewUrl
                                                       ].videoUrl
                                                       : ""
                                             }
                                             width="450px"
                                             height="200px"
                                        />
                                   </div>
                                   <div className="mb-4 p-1 gap-2 flex flex-col">
                                        <div className=" text-xl font-bold">
                                             {studentViewCourseDetails?.title} (Free Preview)
                                        </div>
                                        <span className="text-2xl font-bold">
                                             $ {studentViewCourseDetails?.pricing}
                                        </span>
                                   </div>
                                   <Button className="w-full bg-blue-800 hover:bg-blue-900"
                                        onClick={handleCreatePayment}>
                                        Buy Now
                                   </Button>
                              </CardContent>
                         </Card>
                    </aside>
               </div>
               <Dialog
                    open={showFreePreviewDialog}
                    onOpenChange={() => {
                         setShowFreePreviewDialog(false);
                         setDisplayCurrentVideoFreePreview(null);
                    }}
               >
                    <DialogContent className="w-[800px]">
                         <DialogHeader>
                              <DialogTitle>Course Free Preview</DialogTitle>
                         </DialogHeader>
                         <div className="aspect-video rounded-lg flex items-center justify-center">
                              <VideoPlayer
                                   url={displayCurrentVideoFreePreview}
                                   width="450px"
                                   height="200px"
                              />
                         </div>
                         <div className="flex flex-col gap-2">
                              {studentViewCourseDetails?.curriculum
                                   ?.filter((item) => item.freePreview)
                                   .map((filteredItem) => (
                                        <p
                                             onClick={() => handleSetFreePreview(filteredItem)}
                                             className="cursor-pointer text-[16px] font-medium"
                                        >
                                             {filteredItem?.title}
                                        </p>
                                   ))}
                         </div>
                    </DialogContent>
               </Dialog>
          </div>
     );
}

export default StudentViewCourseDetailsPage;